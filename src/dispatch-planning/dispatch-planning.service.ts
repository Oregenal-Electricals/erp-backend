import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDispatchPlanDto, CancelPlanDto } from './dto/dispatch-plan.dto';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';

@Injectable()
export class DispatchPlanningService {
  constructor(private prisma: PrismaService, private audit: AuditService, private soService: SalesOrdersService) {}

  // DSP-004 sections 46-51, 77: the real fix - active planned qty across
  // EVERY non-cancelled Dispatch Plan for this SO line, not just the raw
  // pendingQty, so two planners can never together plan more than the SO
  // actually has left. Read inside the same transaction as the create()
  // that uses it, so a concurrent create can't slip past a stale read.
  private async unplannedRemaining(tx: any, soItemId: string, pendingQty: number) {
    const activePlans = await tx.dispatchPlanItem.aggregate({
      where: { soItemId, isActive: true, plan: { status: { not: 'CANCELLED' } } },
      _sum: { plannedQty: true },
    });
    const activePlanned = activePlans._sum.plannedQty || 0;
    return Math.max(pendingQty - activePlanned, 0);
  }

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

    const lineData: any[] = [];
    for (const planItem of dto.items) {
      const soItem = so.items.find(i => i.id === planItem.soItemId);
      if (!soItem) throw new NotFoundException(`SO item ${planItem.soItemId} not found`);
      if (!soItem.releasedForDispatch || !soItem.sourceValid) {
        throw new BadRequestException(`"${planItem.itemCode}" has not been released for Dispatch with a valid source yet.`);
      }
      if (planItem.plannedQty <= 0) throw new BadRequestException(`Planned qty must be greater than 0 for ${planItem.itemCode}`);
      lineData.push({ planItem, soItem });
    }

    const plan = await this.prisma.$transaction(async (tx) => {
      const items = [];
      for (const { planItem, soItem } of lineData) {
        const remaining = await this.unplannedRemaining(tx, soItem.id, soItem.pendingQty);
        if (planItem.plannedQty > remaining) {
          throw new BadRequestException(`Planned qty ${planItem.plannedQty} exceeds unplanned remaining demand ${remaining} for ${planItem.itemCode} (other active plans already cover the rest).`);
        }
        const avail = await this.soService.checkAvailability(soItem.id, user);
        const lineStatus = planItem.plannedQty <= (avail.freeQty || 0) ? 'READY_FOR_RESERVATION' : 'STOCK_PENDING';
        items.push({
          soItemId: soItem.id, itemCode: planItem.itemCode, itemName: planItem.itemName,
          plannedQty: planItem.plannedQty, uom: planItem.uom || soItem.uom || 'PCS',
          saleType: soItem.saleType, requiredStageId: soItem.requiredStageId,
          sourceType: soItem.sourceType, sourcePlantId: soItem.sourcePlantId,
          availableSnapshot: avail.freeQty ?? null, snapshotCheckedAt: avail.checkedAt || new Date(),
          lineStatus,
          createdBy: user.id, updatedBy: user.id,
        });
      }

      const planNumber = await this.generateNumber(user.companyId);
      return tx.dispatchPlan.create({
        data: {
          planNumber, soId: dto.soId, customerName: so.customerName,
          deliveryAddress: dto.deliveryAddress, plannedDate: new Date(dto.plannedDate),
          transportMode: dto.transportMode || 'ROAD',
          transporterName: dto.transporterName, vehicleNumber: dto.vehicleNumber,
          driverName: dto.driverName, driverPhone: dto.driverPhone, remarks: dto.remarks,
          companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
          items: { create: items },
        },
        include: this.includes(),
      });
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
    // DSP-004 sections 48-49, 59: show what's ACTUALLY still plannable -
    // pendingQty minus whatever other active plans already claim - not
    // the raw pendingQty, which would let two planners each see the
    // full remaining amount and double-plan it.
    const items = await Promise.all(pendingItems.map(async (i) => ({
      ...i,
      unplannedRemaining: await this.unplannedRemaining(this.prisma, i.id, i.pendingQty),
    })));
    return { soNumber: so.soNumber, customerName: so.customerName, items };
  }
}
