import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';

@Injectable()
export class ProductionMaterialReturnService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionMaterialReturn.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `MRET-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateMaterialReturnDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, companyId: user.companyId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const returnNumber = await this.generateNumber(user.companyId);

    const record = await this.prisma.productionMaterialReturn.create({
      data: {
        companyId: user.companyId, returnNumber,
        workOrderId: dto.workOrderId, warehouseId: dto.warehouseId,
        itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom, qty: dto.qty,
        reason: dto.reason || 'EXCESS_UNUSED', remarks: dto.remarks,
        returnedById: user.id, createdBy: user.id, updatedBy: user.id,
      },
    });

    await this.stockLedger.postTransaction({
      companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
      warehouseId: dto.warehouseId, transactionType: 'RETURN',
      referenceType: 'PRODUCTION_MATERIAL_RETURN', referenceId: record.id, referenceNumber: returnNumber,
      inQty: dto.qty, remarks: `Returned from WO ${wo.woNumber}: ${dto.reason || 'EXCESS_UNUSED'}`,
      userId: user.id,
    });

    await this.audit.log({
      tableName: 'production_material_returns', recordId: record.id, action: 'CREATE',
      newValues: record, changedBy: user.id,
    });

    return record;
  }

  async getPreviousMaterialStatus(workOrderId: string, user: any) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
      include: { bom: { include: { items: { where: { isActive: true } } } } },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const [issuedItems, entries, returns] = await Promise.all([
      this.prisma.productionIssueItem.findMany({
        where: { companyId: user.companyId, productionIssue: { workOrderId, status: 'ISSUED' } },
      }),
      this.prisma.productionEntry.findMany({
        where: { companyId: user.companyId, workOrderId, status: 'CONFIRMED' },
        select: { totalQty: true },
      }),
      this.prisma.productionMaterialReturn.findMany({
        where: { companyId: user.companyId, workOrderId, isActive: true },
      }),
    ]);

    const totalProcessedUnits = entries.reduce((s, e) => s + e.totalQty, 0);

    const issuedByItem = new Map<string, { itemCode: string; itemName: string; uom: string; issuedQty: number }>();
    for (const it of issuedItems) {
      const key = it.itemCode;
      if (!issuedByItem.has(key)) issuedByItem.set(key, { itemCode: it.itemCode, itemName: it.itemName, uom: it.uom, issuedQty: 0 });
      issuedByItem.get(key)!.issuedQty += it.issuedQty;
    }

    const returnedByItem = new Map<string, number>();
    for (const r of returns) {
      returnedByItem.set(r.itemCode, (returnedByItem.get(r.itemCode) || 0) + r.qty);
    }

    const bomRatioByItem = new Map<string, number>();
    for (const bi of (wo.bom?.items || [])) {
      bomRatioByItem.set(bi.itemCode, bi.effectiveQty || bi.quantity);
    }

    const items = Array.from(issuedByItem.values()).map(row => {
      const ratio = bomRatioByItem.get(row.itemCode) || 0;
      const standardConsumed = totalProcessedUnits * ratio;
      const returnedQty = returnedByItem.get(row.itemCode) || 0;
      const accountedQty = standardConsumed + returnedQty;
      const outstandingQty = Math.max(0, row.issuedQty - accountedQty);
      return {
        ...row,
        standardConsumed: Math.round(standardConsumed * 100) / 100,
        returnedQty,
        accountedQty: Math.round(accountedQty * 100) / 100,
        outstandingQty: Math.round(outstandingQty * 100) / 100,
        status: outstandingQty > 0.0001 ? 'PENDING' : 'CLEAR',
      };
    });

    const overallStatus = items.some(i => i.status === 'PENDING') ? 'PENDING' : 'CLEAR';

    return { workOrderId, woNumber: wo.woNumber, items, overallStatus };
  }
}
