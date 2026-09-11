import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { RejectedStockService } from '../rejected-stock/rejected-stock.service';
import { ReinspectDto } from './dto/hold-stock.dto';

@Injectable()
export class HoldStockService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockLedger: StockLedgerService,
    private rejectedStock: RejectedStockService,
  ) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.holdStock.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `HOLD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateIqcNumber(companyId: string): Promise<string> {
    const count = await this.prisma.iqcInspection.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `IQC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      iqc: { select: { iqcNumber: true } },
      grn: { select: { grnNumber: true, grnType: true } },
      warehouse: { select: { name: true, code: true } },
      items: { where: { isActive: true } },
    };
  }

  // Mirrors RejectedStockService.createFromIqc() exactly - same
  // precondition (IQC must be APPROVED), same "don't duplicate" guard,
  // same shape. Held material needs identical physical traceability to
  // rejected material, just with a different eventual outcome.
  async createFromIqc(iqcId: string, user: any) {
    const iqc = await this.prisma.iqcInspection.findFirst({
      where: { id: iqcId, companyId: user.companyId },
      include: { items: { where: { isActive: true, holdQty: { gt: 0 } } }, grn: true },
    });
    if (!iqc) throw new NotFoundException('IQC not found');
    if (iqc.status !== 'APPROVED') throw new BadRequestException('IQC must be APPROVED');

    const heldItems = iqc.items.filter(i => i.holdQty > 0);
    if (heldItems.length === 0) throw new BadRequestException('No held items in this IQC');

    const existing = await this.prisma.holdStock.findFirst({ where: { iqcId, companyId: user.companyId } });
    if (existing) throw new BadRequestException('Hold record already exists for this IQC');

    const grn = iqc.grn as any;
    const holdNumber = await this.generateNumber(user.companyId);
    const totalHoldQty = heldItems.reduce((s, i) => s + i.holdQty, 0);

    const held = await this.prisma.holdStock.create({
      data: {
        holdNumber, iqcId, grnId: grn.id, warehouseId: grn.warehouseId, totalHoldQty,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: heldItems.map(item => ({
            iqcItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
            holdQty: item.holdQty, holdReason: item.holdReason,
            companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
          })),
        },
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'hold_stock', recordId: held.id, action: 'CREATE', newValues: held, changedBy: user.id });
    return held;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ holdNumber: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.holdStock.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          iqc: { select: { iqcNumber: true } },
          grn: { select: { grnNumber: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.holdStock.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const where: any = { id };
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const rec = await this.prisma.holdStock.findFirst({ where, include: this.includes() });
    if (!rec) throw new NotFoundException('Hold stock record not found');
    return rec;
  }

  // STORE-008 sections 22-23: Quality reopens Hold material and decides
  // pass/fail (possibly a partial split of both). Never overwrites the
  // original IqcItem.holdQty or HoldStockItem row - the reinspection
  // outcome is recorded alongside it, preserving full QC history. The
  // pass portion is routed through a brand-new, small IqcInspection set
  // straight to APPROVED and then through the existing, already-tested
  // receiveFromIqc() - reusing the entire normal stock-crediting and
  // Put-Away pipeline rather than inventing a parallel "approved from
  // hold" state. The fail portion reuses RejectedStockService the same
  // way. Store never self-releases hold material - this whole action is
  // Quality-only (QC_IQC_CORRECT-equivalent permission at the controller).
  async reinspect(id: string, itemId: string, dto: ReinspectDto, user: any) {
    const rec = await this.findOne(id, user);
    if (rec.status === 'CLOSED') throw new BadRequestException('Cannot reinspect a closed hold record');

    const item = (rec.items as any[]).find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');
    if (item.reinspectionStatus !== 'PENDING') throw new BadRequestException('This item has already been reinspected');

    const total = dto.passQty + dto.failQty;
    if (total <= 0) throw new BadRequestException('Enter a pass or fail quantity');
    if (total > item.holdQty) throw new BadRequestException(`Reinspected qty (${total}) cannot exceed held qty (${item.holdQty})`);

    const reinspectionStatus = dto.failQty === 0 ? 'PASS' : dto.passQty === 0 ? 'FAIL' : 'PARTIAL';

    await this.prisma.holdStockItem.update({
      where: { id: itemId },
      data: {
        reinspectionStatus, reinspectedPassQty: dto.passQty, reinspectedFailQty: dto.failQty,
        reinspectedAt: new Date(), reinspectedBy: user.id, reinspectionNotes: dto.notes, updatedBy: user.id,
      },
    });

    // Look up the originating GrnItem via the original IqcItem, not by
    // itemCode/grnId alone, since a GRN can have the same item code on
    // more than one line.
    const originalIqcItem = item.iqcItemId ? await this.prisma.iqcItem.findUnique({ where: { id: item.iqcItemId } }) : null;
    const resolvedGrnItemId = originalIqcItem?.grnItemId;

    const iqcNumber = await this.generateIqcNumber(user.companyId);
    const reinspectionIqc = await this.prisma.iqcInspection.create({
      data: {
        iqcNumber, grnId: rec.grnId as string, status: 'APPROVED',
        remarks: `Reinspection of ${rec.holdNumber} item ${item.itemCode}${dto.notes ? ' - ' + dto.notes : ''}`,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        items: {
          create: [{
            grnItemId: resolvedGrnItemId || item.iqcItemId || itemId,
            itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
            receivedQty: total, acceptedQty: dto.passQty, rejectedQty: dto.failQty,
            rejectionReason: dto.failQty > 0 ? `Failed reinspection from hold (${rec.holdNumber})` : undefined,
            companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
          }],
        },
      },
    });

    if (dto.passQty > 0) {
      await this.stockLedger.receiveFromIqc(reinspectionIqc.id, user);
    }
    if (dto.failQty > 0) {
      await this.rejectedStock.createFromIqc(reinspectionIqc.id, user);
    }

    // If every item on this hold record has now been reinspected, close it.
    const refreshed = await this.findOne(id, user);
    const allDone = (refreshed.items as any[]).every(i => i.reinspectionStatus !== 'PENDING');
    if (allDone) {
      await this.prisma.holdStock.update({ where: { id }, data: { status: 'CLOSED', updatedBy: user.id } });
    } else {
      await this.prisma.holdStock.update({ where: { id }, data: { status: 'PARTIALLY_RELEASED', updatedBy: user.id } });
    }

    await this.audit.log({
      tableName: 'hold_stock', recordId: id, action: 'UPDATE',
      newValues: { itemId, reinspectionStatus, passQty: dto.passQty, failQty: dto.failQty, reinspectionIqcId: reinspectionIqc.id },
      changedBy: user.id,
    });

    return this.findOne(id, user);
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, held, closed] = await Promise.all([
      this.prisma.holdStock.count({ where }),
      this.prisma.holdStock.count({ where: { ...where, status: 'HELD' } }),
      this.prisma.holdStock.count({ where: { ...where, status: 'CLOSED' } }),
    ]);
    const totalQty = await this.prisma.holdStock.aggregate({ where, _sum: { totalHoldQty: true } });
    return { total, held, closed, totalHoldQty: totalQty._sum.totalHoldQty || 0 };
  }
}
