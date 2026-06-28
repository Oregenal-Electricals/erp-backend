import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class StockAdjustmentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.stockAdjustment.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `ADJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true } },
    };
  }

  async create(dto: CreateAdjustmentDto, user: any) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Adjustment must have at least one item');

    const adjustmentNumber = await this.generateNumber(user.companyId);
    // Calculate adjustmentQty for each item
    const items = dto.items.map(item => {
      let adjustmentQty = 0;
      if (dto.adjustmentType === 'INCREASE') adjustmentQty = item.physicalQty - item.systemQty;
      else if (dto.adjustmentType === 'DECREASE') adjustmentQty = item.systemQty - item.physicalQty;
      else adjustmentQty = item.physicalQty - item.systemQty; // RECOUNT
      return { ...item, adjustmentQty };
    });

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        adjustmentNumber, warehouseId: dto.warehouseId,
        adjustmentType: dto.adjustmentType, reason: dto.reason,
        remarks: dto.remarks, status: 'DRAFT',
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: { create: items.map(item => ({ ...item, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'stock_adjustments', recordId: adjustment.id, action: 'CREATE', newValues: adjustment, changedBy: user.id });
    return adjustment;
  }

  async approve(id: string, user: any) {
    const adj = await this.prisma.stockAdjustment.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'DRAFT') throw new BadRequestException('Only DRAFT adjustments can be approved');

    for (const item of adj.items) {
      const diff = item.adjustmentQty;
      if (diff === 0) continue;

      // Check no negative stock on decrease
      if (diff < 0) {
        const balance = await this.prisma.stockBalance.findFirst({
          where: { companyId: user.companyId, warehouseId: adj.warehouseId, itemCode: item.itemCode },
        });
        if (!balance || balance.availableQty < Math.abs(diff)) {
          throw new BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${balance?.availableQty || 0}`);
        }
      }

      // Post to stock ledger
      await this.stockLedger.postTransaction({
        companyId: user.companyId,
        itemCode: item.itemCode, itemName: item.itemName,
        warehouseId: adj.warehouseId,
        transactionType: 'ADJUSTMENT',
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: adj.id, referenceNumber: adj.adjustmentNumber,
        inQty: diff > 0 ? diff : 0,
        outQty: diff < 0 ? Math.abs(diff) : 0,
        unitCost: item.unitCost,
        remarks: `${adj.adjustmentType} - ${adj.reason}`,
        userId: user.id,
      });
    }

    const updated = await this.prisma.stockAdjustment.update({
      where: { id }, data: { status: 'APPROVED', updatedBy: user.id }, include: this.includes(),
    });
    await this.audit.log({ tableName: 'stock_adjustments', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async cancel(id: string, user: any) {
    const adj = await this.prisma.stockAdjustment.findFirst({ where: { id, companyId: user.companyId } });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'DRAFT') throw new BadRequestException('Only DRAFT adjustments can be cancelled');
    return this.prisma.stockAdjustment.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ adjustmentNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const adj = await this.prisma.stockAdjustment.findFirst({ where, include: this.includes() });
    if (!adj) throw new NotFoundException('Adjustment not found');
    return adj;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, draft, approved, cancelled] = await Promise.all([
      this.prisma.stockAdjustment.count({ where }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.stockAdjustment.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    const byType = await this.prisma.stockAdjustment.groupBy({ by: ['adjustmentType'], where, _count: true });
    const byReason = await this.prisma.stockAdjustment.groupBy({ by: ['reason'], where: { ...where, status: 'APPROVED' }, _count: true });
    return { total, draft, approved, cancelled, byType, byReason };
  }
}
