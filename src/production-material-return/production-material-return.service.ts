import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { StockLocationBalanceService } from '../stock-location-balance/stock-location-balance.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';

@Injectable()
export class ProductionMaterialReturnService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
    private locationBalance: StockLocationBalanceService,
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

    // STORE-014 sections 15-16, 40: return qty must never exceed what's
    // still genuinely outstanding for this item on this WO - reuses the
    // exact same reconciliation this service already computes for
    // STORE-012's previous-material-status check, since "outstanding"
    // there and "returnable" here are the same number. Blocks returning
    // material that was already consumed, already returned, or never
    // issued at all.
    const status = await this.getPreviousMaterialStatus(dto.workOrderId, user);
    const itemStatus = status.items.find(i => i.itemCode === dto.itemCode);
    const returnableQty = itemStatus ? itemStatus.outstandingQty : 0;
    if (dto.qty > returnableQty + 0.0001) {
      throw new BadRequestException(`Return qty (${dto.qty}) exceeds the outstanding returnable quantity (${returnableQty}) for ${dto.itemCode} on this Work Order.`);
    }

    // STORE-014 sections 5, 21-23: link to the original issue line and
    // preserve its batch identity - never invent a new batch for
    // returned material.
    let batchId: string | undefined;
    if (dto.originalIssueItemId) {
      const originalItem = await this.prisma.productionIssueItem.findFirst({ where: { id: dto.originalIssueItemId, companyId: user.companyId } });
      if (!originalItem) throw new NotFoundException('Original issue line not found');
      if (originalItem.itemCode !== dto.itemCode) {
        throw new BadRequestException(`This issue line is for ${originalItem.itemCode}, not ${dto.itemCode} - cannot link a mismatched return to it.`);
      }
      batchId = originalItem.batchId || undefined;
    }

    const condition = dto.condition || 'GOOD';
    const returnNumber = await this.generateNumber(user.companyId);

    const record = await this.prisma.productionMaterialReturn.create({
      data: {
        companyId: user.companyId, returnNumber,
        workOrderId: dto.workOrderId, warehouseId: dto.warehouseId,
        itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom, qty: dto.qty,
        reason: dto.reason || 'EXCESS_UNUSED', condition,
        originalIssueItemId: dto.originalIssueItemId, batchId,
        remarks: dto.remarks,
        returnedById: user.id, createdBy: user.id, updatedBy: user.id,
      },
    });

    if (condition === 'GOOD') {
      // STORE-014 sections 10, 29, 37: good, verified material re-enters
      // Available directly through an internal movement - no new
      // GRN/PO/Gate-In of any kind.
      await this.stockLedger.postTransaction({
        companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
        warehouseId: dto.warehouseId, transactionType: 'RETURN',
        referenceType: 'PRODUCTION_MATERIAL_RETURN', referenceId: record.id, referenceNumber: returnNumber,
        inQty: dto.qty, remarks: `Returned from WO ${wo.woNumber}: ${dto.reason || 'EXCESS_UNUSED'}`,
        userId: user.id,
      });
      if (dto.destinationBinId) {
        await this.locationBalance.adjustQty({
          companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
          warehouseId: dto.warehouseId, binId: dto.destinationBinId, batchId,
          status: 'AVAILABLE', deltaQty: dto.qty, userId: user.id,
        });
      }
    } else {
      // STORE-014 sections 11, 28, 38-39: uncertain/damaged condition
      // never silently becomes Available - routes to Hold (same
      // mechanism as an IQC-held batch) for controlled disposition
      // later. Never touches StockBalance.availableQty.
      const holdNumber = `HOLD-RET-${new Date().getFullYear()}-${String(record.id).slice(0, 6)}`;
      await this.prisma.holdStock.create({
        data: {
          companyId: user.companyId, holdNumber, warehouseId: dto.warehouseId,
          totalHoldQty: dto.qty, remarks: `Production return from WO ${wo.woNumber} - condition: ${condition}`,
          createdBy: user.id, updatedBy: user.id,
          items: {
            create: [{
              companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
              uom: dto.uom, holdQty: dto.qty, holdReason: `Returned material condition: ${condition}`,
              createdBy: user.id, updatedBy: user.id,
            }],
          },
        },
      });
      if (dto.destinationBinId) {
        await this.locationBalance.adjustQty({
          companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
          warehouseId: dto.warehouseId, binId: dto.destinationBinId, batchId,
          status: 'HOLD', deltaQty: dto.qty, userId: user.id,
        });
      }
    }

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
