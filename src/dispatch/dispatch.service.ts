import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDispatchDto } from './dto/dispatch.dto';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatch.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DSP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      items: true,
      dispatchPlan: { select: { planNumber: true, transportMode: true } },
      salesOrder: { select: { soNumber: true, customerName: true, cpo: { select: { cpoNumber: true, customerPoNumber: true } } } },
    };
  }

  async create(dto: CreateDispatchDto, user: any) {
    // Validate dispatch plan
    const plan = await this.prisma.dispatchPlan.findFirst({
      where: { id: dto.planId, companyId: user.companyId },
      include: { items: true, salesOrder: { include: { items: true } } },
    });
    if (!plan) throw new NotFoundException('Dispatch plan not found');
    if (plan.status !== 'APPROVED') throw new BadRequestException('Only APPROVED dispatch plans can be dispatched');

    // Validate dispatched qty vs planned qty
    for (const dItem of dto.items) {
      const planItem = plan.items.find(i => i.soItemId === dItem.soItemId);
      const soItem = plan.salesOrder.items.find(i => i.id === dItem.soItemId);
      if (!soItem) throw new NotFoundException(`SO item not found: ${dItem.soItemId}`);
      if (planItem && dItem.dispatchedQty > planItem.plannedQty) throw new BadRequestException(`Dispatched qty exceeds planned qty for ${dItem.itemCode}`);
      if (dItem.dispatchedQty > soItem.pendingQty) throw new BadRequestException(`Dispatched qty exceeds pending qty for ${dItem.itemCode}`);
    }

    const dispatchNumber = await this.generateNumber(user.companyId);

    // Calculate item amounts
    const calcItems = dto.items.map(item => {
      const soItem = plan.salesOrder.items.find(i => i.id === item.soItemId);
      const unitPrice = item.unitPrice || soItem?.unitPrice || 0;
      const gstRate = item.gstRate || soItem?.gstRate || 18;
      const taxableAmt = Math.round(item.dispatchedQty * unitPrice * 100) / 100;
      const gstAmount = Math.round(taxableAmt * gstRate / 100 * 100) / 100;
      const totalAmount = Math.round((taxableAmt + gstAmount) * 100) / 100;
      return {
        planItemId: item.planItemId, soItemId: item.soItemId,
        itemCode: item.itemCode, itemName: item.itemName,
        dispatchedQty: item.dispatchedQty, uom: item.uom || soItem?.uom || 'PCS',
        unitPrice, gstRate, gstAmount, totalAmount,
        createdBy: user.id, updatedBy: user.id,
      };
    });

    const dispatch = await this.prisma.dispatch.create({
      data: {
        dispatchNumber, planId: dto.planId, soId: plan.soId,
        customerName: plan.customerName,
        deliveryAddress: dto.deliveryAddress || plan.deliveryAddress,
        dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : new Date(),
        vehicleNumber: dto.vehicleNumber || plan.vehicleNumber,
        transporterName: dto.transporterName || plan.transporterName,
        driverName: dto.driverName || plan.driverName,
        driverPhone: dto.driverPhone || plan.driverPhone,
        lrNumber: dto.lrNumber, ewayBillNumber: dto.ewayBillNumber,
        remarks: dto.remarks, status: 'DISPATCHED',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: calcItems },
      },
      include: this.includes(),
    });

    // Update SO item dispatchedQty and pendingQty
    for (const item of dto.items) {
      const soItem = plan.salesOrder.items.find(i => i.id === item.soItemId);
      if (soItem) {
        const newDispatched = soItem.dispatchedQty + item.dispatchedQty;
        const newPending = soItem.qty - newDispatched;
        await this.prisma.salesOrderItem.update({
          where: { id: item.soItemId },
          data: { dispatchedQty: newDispatched, pendingQty: Math.max(0, newPending), updatedBy: user.id },
        });
      }
    }

    // Mark dispatch plan as DISPATCHED
    await this.prisma.dispatchPlan.update({
      where: { id: dto.planId },
      data: { status: 'DISPATCHED', updatedBy: user.id },
    });

    // Check if all SO items fully dispatched → update SO status
    const updatedSo = await this.prisma.salesOrder.findFirst({
      where: { id: plan.soId }, include: { items: true },
    });
    const allDispatched = updatedSo.items.every(i => i.pendingQty <= 0);
    if (allDispatched) {
      await this.prisma.salesOrder.update({
        where: { id: plan.soId },
        data: { status: 'DISPATCHED', updatedBy: user.id },
      });
    } else {
      await this.prisma.salesOrder.update({
        where: { id: plan.soId },
        data: { status: 'IN_PRODUCTION', updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'dispatches', recordId: dispatch.id, action: 'CREATE', newValues: dispatch, changedBy: user.id });
    return dispatch;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { dispatchNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { vehicleNumber: { contains: search, mode: 'insensitive' } },
      { lrNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.dispatch.findMany({
        where, skip, take: Number(limit), orderBy: { dispatchDate: 'desc' },
        include: { items: { select: { id: true, itemCode: true, dispatchedQty: true } }, salesOrder: { select: { soNumber: true } }, dispatchPlan: { select: { planNumber: true } } },
      }),
      this.prisma.dispatch.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const dispatch = await this.prisma.dispatch.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, dispatched, delivered, cancelled] = await Promise.all([
      this.prisma.dispatch.count({ where }),
      this.prisma.dispatch.count({ where: { ...where, status: 'DISPATCHED' } }),
      this.prisma.dispatch.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.dispatch.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const totalQty = await this.prisma.dispatchItem.aggregate({
      where: { dispatch: { companyId: user.companyId } }, _sum: { dispatchedQty: true },
    });
    return { total, dispatched, delivered, cancelled, totalQtyDispatched: totalQty._sum.dispatchedQty || 0 };
  }
}
