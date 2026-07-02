import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDispatchPlanDto, CancelPlanDto } from './dto/dispatch-plan.dto';

@Injectable()
export class DispatchPlanningService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.dispatchPlan.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      items: true,
      salesOrder: { select: { soNumber: true, customerName: true, totalAmount: true, status: true } },
    };
  }

  async create(dto: CreateDispatchPlanDto, user: any) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id: dto.soId, companyId: user.companyId },
      include: { items: true },
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    if (!['CONFIRMED','IN_PRODUCTION'].includes(so.status)) throw new BadRequestException('SO must be CONFIRMED or IN_PRODUCTION');

    // Validate planned qty vs pending qty
    for (const planItem of dto.items) {
      const soItem = so.items.find(i => i.id === planItem.soItemId);
      if (!soItem) throw new NotFoundException(`SO item ${planItem.soItemId} not found`);
      if (planItem.plannedQty > soItem.pendingQty) throw new BadRequestException(`Planned qty ${planItem.plannedQty} exceeds pending qty ${soItem.pendingQty} for ${planItem.itemCode}`);
    }

    const planNumber = await this.generateNumber(user.companyId);

    const plan = await this.prisma.dispatchPlan.create({
      data: {
        planNumber, soId: dto.soId, customerName: so.customerName,
        deliveryAddress: dto.deliveryAddress, plannedDate: new Date(dto.plannedDate),
        transportMode: dto.transportMode || 'ROAD',
        transporterName: dto.transporterName, vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName, driverPhone: dto.driverPhone, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: dto.items.map(item => ({
            soItemId: item.soItemId, itemCode: item.itemCode, itemName: item.itemName,
            plannedQty: item.plannedQty, uom: item.uom || 'PCS',
            createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'dispatch_plans', recordId: plan.id, action: 'CREATE', newValues: plan, changedBy: user.id });
    return plan;
  }

  async approve(id: string, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId } });
    if (!plan) throw new NotFoundException('Dispatch plan not found');
    if (plan.status !== 'DRAFT') throw new BadRequestException('Only DRAFT plans can be approved');

    const updated = await this.prisma.dispatchPlan.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: user.id, approvedDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_plans', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, dto: CancelPlanDto, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId } });
    if (!plan) throw new NotFoundException('Dispatch plan not found');
    if (['DISPATCHED','CANCELLED'].includes(plan.status)) throw new BadRequestException(`Cannot cancel ${plan.status} plan`);

    const updated = await this.prisma.dispatchPlan.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: dto.cancelReason, updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'dispatch_plans', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, soId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (search) where.OR = [
      { planNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { vehicleNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (soId) where.soId = soId;

    const [data, total] = await Promise.all([
      this.prisma.dispatchPlan.findMany({
        where, skip, take: Number(limit), orderBy: { plannedDate: 'asc' },
        include: { items: { select: { id: true, itemCode: true, plannedQty: true } }, salesOrder: { select: { soNumber: true, customerName: true } } },
      }),
      this.prisma.dispatchPlan.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const plan = await this.prisma.dispatchPlan.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!plan) throw new NotFoundException('Dispatch plan not found');
    return plan;
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, draft, approved, dispatched, cancelled, overdue] = await Promise.all([
      this.prisma.dispatchPlan.count({ where }),
      this.prisma.dispatchPlan.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.dispatchPlan.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.dispatchPlan.count({ where: { ...where, status: 'DISPATCHED' } }),
      this.prisma.dispatchPlan.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.dispatchPlan.count({ where: { ...where, status: 'APPROVED', plannedDate: { lt: new Date() } } }),
    ]);
    return { total, draft, approved, dispatched, cancelled, overdue };
  }

  async getPendingSoItems(soId: string, user: any) {
    const so = await this.prisma.salesOrder.findFirst({
      where: { id: soId, companyId: user.companyId },
      include: { items: true },
    });
    if (!so) throw new NotFoundException('Sales Order not found');
    const pendingItems = so.items.filter(i => i.pendingQty > 0);
    return { soNumber: so.soNumber, customerName: so.customerName, items: pendingItems };
  }
}
