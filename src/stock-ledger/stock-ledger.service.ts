import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AdjustStockDto } from './dto/stock-ledger.dto';
import { CustomerPoService } from '../customer-po/customer-po.service';

@Injectable()
export class StockLedgerService {
  constructor(private prisma: PrismaService, private audit: AuditService, private customerPoService: CustomerPoService) {}

  // Core method: update stock balance and create ledger entry
  async postTransaction(data: {
    companyId: string; itemCode: string; itemName: string;
    warehouseId: string; transactionType: string;
    referenceType?: string; referenceId?: string; referenceNumber?: string;
    inQty?: number; outQty?: number; unitCost?: number; remarks?: string;
    userId: string;
  }) {
    const { companyId, itemCode, itemName, warehouseId, transactionType,
      referenceType, referenceId, referenceNumber, inQty = 0, outQty = 0,
      unitCost = 0, remarks, userId } = data;

    // Get or create stock balance
    let balance = await this.prisma.stockBalance.findFirst({
      where: { companyId, itemCode, warehouseId },
    });

    if (!balance) {
      balance = await this.prisma.stockBalance.create({
        data: {
          companyId, itemCode, itemName, warehouseId,
          availableQty: 0, unitCost: 0, totalValue: 0,
          createdBy: userId, updatedBy: userId,
        },
      });
    }

    // Check negative stock rule
    if (outQty > 0 && balance.availableQty < outQty) {
      throw new BadRequestException(`Insufficient stock for ${itemCode}. Available: ${balance.availableQty}, Required: ${outQty}`);
    }

    const newBalance = balance.availableQty + inQty - outQty;
    const totalCost = inQty * unitCost || outQty * balance.unitCost;

    // Weighted average cost for incoming stock
    let newUnitCost = balance.unitCost;
    if (inQty > 0 && unitCost > 0) {
      const existingValue = balance.availableQty * balance.unitCost;
      const newValue = inQty * unitCost;
      newUnitCost = (existingValue + newValue) / (balance.availableQty + inQty);
    }

    // Create ledger entry
    const ledgerEntry = await this.prisma.stockLedger.create({
      data: {
        companyId, itemCode, itemName, warehouseId,
        transactionType, referenceType, referenceId, referenceNumber,
        inQty, outQty, balanceQty: newBalance,
        unitCost: inQty > 0 ? unitCost : balance.unitCost,
        totalCost, remarks,
        createdBy: userId, updatedBy: userId,
      },
    });

    // Update stock balance
    await this.prisma.stockBalance.update({
      where: { id: balance.id },
      data: {
        availableQty: newBalance,
        unitCost: newUnitCost,
        totalValue: newBalance * newUnitCost,
        lastUpdated: new Date(),
        updatedBy: userId,
      },
    });

    // Stock genuinely increased - re-check every open Customer PO so
    // shortage numbers stay live without needing a manual re-check.
    if (inQty > 0) {
      try {
        await this.customerPoService.recheckAllOpenPos(companyId, userId);
      } catch (e) {
        // swallow - the stock posting itself must still succeed
      }
    }

    return ledgerEntry;
  }

  async receiveFromIqc(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: {
        items: { where: { isActive: true } },
        grn: { include: { ipo: true, po: true } },
      },
    });
    if (!iqc) throw new NotFoundException('IQC not found');
    if (iqc.status !== 'APPROVED') throw new BadRequestException('IQC must be APPROVED');

    const grn = iqc.grn as any;
    const entries = [];

    for (const item of iqc.items) {
      if (item.acceptedQty > 0) {
        // Get landed cost per unit from GRN item
        const grnItem = await this.prisma.grnItem.findFirst({ where: { id: item.grnItemId } });
        const unitCost = grnItem?.landedCostPerUnit || grnItem?.unitPrice || 0;

        const entry = await this.postTransaction({
          companyId: user.companyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          warehouseId: grn.warehouseId,
          transactionType: 'IQC_ACCEPT',
          referenceType: 'IQC',
          referenceId: iqcId,
          referenceNumber: iqc.iqcNumber,
          inQty: item.acceptedQty,
          unitCost,
          remarks: `Stock received from IQC ${iqc.iqcNumber}`,
          userId: user.id,
        });
        entries.push(entry);
      }
    }

    await this.audit.log({ tableName: 'stock_ledger', recordId: iqcId, action: 'CREATE', newValues: { entries: entries.length }, changedBy: user.id });
    return { message: `${entries.length} stock entries created`, entries };
  }

  async findLedger(user: any, query: any) {
    const { page = 1, limit = 20, itemCode, warehouseId, transactionType } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (itemCode) where.itemCode = { contains: itemCode, mode: 'insensitive' };
    if (warehouseId) where.warehouseId = warehouseId;
    if (transactionType) where.transactionType = transactionType;

    const [data, total] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockLedger.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findBalance(user: any, query: any) {
    const { page = 1, limit = 50, search, warehouseId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { itemCode: { contains: search, mode: 'insensitive' } },
      { itemName: { contains: search, mode: 'insensitive' } },
    ];
    if (warehouseId) where.warehouseId = warehouseId;

    const [data, total] = await Promise.all([
      this.prisma.stockBalance.findMany({
        where, skip, take: Number(limit), orderBy: { itemCode: 'asc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.stockBalance.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async getItemLedger(itemCode: string, user: any) {
    const where: any = { itemCode };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    return this.prisma.stockLedger.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 50,
      include: { warehouse: { select: { name: true } } },
    });
  }

  async adjust(dto: AdjustStockDto, user: any) {
    const inQty = dto.adjustmentType === 'ADD' ? dto.qty : 0;
    const outQty = dto.adjustmentType === 'REMOVE' ? dto.qty : 0;
    return this.postTransaction({
      companyId: user.companyId,
      itemCode: dto.itemCode,
      itemName: dto.itemCode,
      warehouseId: dto.warehouseId,
      transactionType: 'ADJUSTMENT',
      inQty, outQty,
      unitCost: dto.unitCost,
      remarks: dto.remarks,
      userId: user.id,
    });
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [totalItems, totalMovements, totalValue] = await Promise.all([
      this.prisma.stockBalance.count({ where: { ...where, availableQty: { gt: 0 } } }),
      this.prisma.stockLedger.count({ where }),
      this.prisma.stockBalance.aggregate({ where, _sum: { totalValue: true } }),
    ]);
    const byType = await this.prisma.stockLedger.groupBy({ by: ['transactionType'], where, _count: true, _sum: { inQty: true, outQty: true } });
    return { totalItems, totalMovements, totalValue: totalValue._sum.totalValue || 0, byType };
  }
}
