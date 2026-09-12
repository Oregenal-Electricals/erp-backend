import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { MrpService } from '../mrp/mrp.service';
import { ProductionMaterialReturnService } from '../production-material-return/production-material-return.service';
import { MaterialIssueOverrideService } from '../material-issue-override/material-issue-override.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
import { CreateProductionIssueDto } from './dto/production-issue.dto';

@Injectable()
export class ProductionIssueService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
    private mrpService: MrpService,
    private materialReturnService: ProductionMaterialReturnService,
    private overrideService: MaterialIssueOverrideService,
    private materialReservation: MaterialReservationService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionIssue.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PI-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true }, include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
    };
  }

  async createFromMrp(workOrderId: string, user: any) {
    // Auto-create production issue from MRP calculation
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!['RELEASED','IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException('Work order must be RELEASED or IN_PROGRESS');
    }

    const mrp = await this.mrpService.calculateMrp(workOrderId, user);
    const items = mrp.requirements.map(r => ({
      itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
      requiredQty: r.netRequired, issuedQty: Math.min(r.netRequired, r.availableQty),
      batchId: r.batches?.[0] ? undefined : undefined,
      unitCost: 0,
    }));

    return this.create({ workOrderId, warehouseId: wo.warehouseId, items, issueMethod: 'FIFO' }, user);
  }

  async create(dto: CreateProductionIssueDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, companyId: user.companyId },
    });
    if (!wo) throw new NotFoundException('Work order not found');
    if (!['RELEASED','IN_PROGRESS'].includes(wo.status)) {
      throw new BadRequestException('Work order must be RELEASED or IN_PROGRESS');
    }

    // Previous material status gate: new material cannot normally be
    // issued for this WO while an earlier issue on the same WO is still
    // unreconciled. Backend-enforced (not just a frontend indicator) -
    // this is the actual block, override is a separate, explicit path
    // built on top of this rather than a way around it.
    const status = await this.materialReturnService.getPreviousMaterialStatus(dto.workOrderId, user);
    let usedOverride: { id: string } | null = null;
    if (status.overallStatus === 'PENDING') {
      // An approved, still-valid (within its 5-hour window), not-yet-used
      // override is a one-time exception to this exact block - it does not
      // clear the outstanding balance itself, and is consumed the moment
      // it's used so it can't cover a second issue.
      const override = await this.overrideService.findActiveApprovedOverride(dto.workOrderId, user);
      if (!override) {
        const pendingItems = status.items.filter(i => i.status === 'PENDING');
        const summary = pendingItems.map(i => `${i.itemCode}: ${i.outstandingQty} ${i.uom} unreconciled`).join('; ');
        throw new BadRequestException(`Previous material status pending for this Work Order - ${summary}. Return, consume, or account for the outstanding quantity before issuing new material, or request a management override.`);
      }
      usedOverride = override;
    }

    const issueNumber = await this.generateNumber(user.companyId);
    const issue = await this.prisma.productionIssue.create({
      data: {
        issueNumber, workOrderId: dto.workOrderId,
        warehouseId: dto.warehouseId, issueMethod: dto.issueMethod || 'FIFO',
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: dto.items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })),
        },
      },
      include: this.includes(),
    });

    // Auto-start WO if released
    if (wo.status === 'RELEASED') {
      await this.prisma.workOrder.update({
        where: { id: dto.workOrderId },
        data: { status: 'IN_PROGRESS', actualStartDate: new Date(), updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'production_issues', recordId: issue.id, action: 'CREATE', newValues: issue, changedBy: user.id });

    if (usedOverride) {
      await this.overrideService.consume(usedOverride.id, issue.id, user);
    }

    return issue;
  }

  async confirm(id: string, user: any) {
    const issue = await this.prisma.productionIssue.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!issue) throw new NotFoundException('Production issue not found');
    if (issue.status !== 'DRAFT') throw new BadRequestException('Only DRAFT issues can be confirmed');

    // Validate stock and deduct
    for (const item of issue.items) {
      const balance = await this.prisma.stockBalance.findFirst({
        where: { companyId: user.companyId, warehouseId: issue.warehouseId, itemCode: item.itemCode },
      });
      if (!balance || balance.availableQty < item.issuedQty) {
        throw new BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${balance?.availableQty || 0}`);
      }

      // Post stock ledger OUT
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: issue.warehouseId,
        transactionType: 'ISSUE',
        referenceType: 'PRODUCTION_ISSUE',
        referenceId: issue.id, referenceNumber: issue.issueNumber,
        outQty: item.issuedQty, unitCost: item.unitCost,
        remarks: `Production issue for ${issue.workOrderId}`,
        userId: user.id,
      });

      // Update batch if specified
      if (item.batchId) {
        await this.prisma.stockBatch.update({
          where: { id: item.batchId },
          data: { availableQty: { decrement: item.issuedQty }, updatedBy: user.id },
        });
      }

      // STORE-011: this is the actual physical departure - the material
      // was reserved (StockBalance.reservedQty went up, availableQty
      // never moved) and now it's genuinely leaving, so both
      // availableQty (already decremented above via postTransaction)
      // AND reservedQty come down together. Capped at whatever is
      // actually reserved, so an override/unreserved issue never drives
      // reservedQty negative.
      const decrementReserved = Math.min(item.issuedQty, balance.reservedQty);
      if (decrementReserved > 0.0001) {
        await this.prisma.stockBalance.updateMany({
          where: { id: balance.id },
          data: { reservedQty: { decrement: decrementReserved } },
        });
      }
      if (issue.workOrderId) {
        await this.materialReservation.recordIssueAgainstReservations(issue.workOrderId, item.itemCode, item.issuedQty, user);
      }
    }

    const updated = await this.prisma.productionIssue.update({
      where: { id }, data: { status: 'ISSUED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'production_issues', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status, workOrderId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ issueNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (workOrderId) where.workOrderId = workOrderId;

    const [data, total] = await Promise.all([
      this.prisma.productionIssue.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          workOrder: { select: { woNumber: true, productName: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.productionIssue.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const issue = await this.prisma.productionIssue.findFirst({ where, include: this.includes() });
    if (!issue) throw new NotFoundException('Production issue not found');
    return issue;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, issued] = await Promise.all([
      this.prisma.productionIssue.count({ where }),
      this.prisma.productionIssue.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.productionIssue.count({ where: { ...where, status: 'ISSUED' } }),
    ]);
    const totalQty = await this.prisma.productionIssueItem.aggregate({
      where: { companyId: where.companyId }, _sum: { issuedQty: true },
    });
    return { total, draft, issued, totalQtyIssued: totalQty._sum.issuedQty || 0 };
  }
}
