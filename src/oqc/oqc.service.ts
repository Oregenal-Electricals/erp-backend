import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateOqcDto, CompleteOqcDto } from './dto/oqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';

@Injectable()
export class OqcService {
  constructor(private prisma: PrismaService, private audit: AuditService, private stockLedger: StockLedgerService) {}

  // PRE_PACK/POST_PACK fields that must not be set on the other stage -
  // keeps data honest about which checklist a given record actually
  // covers instead of silently storing an irrelevant check result.
  private static readonly STAGE_FIELDS: Record<string, string[]> = {
    PRE_PACK: ['visualCheck', 'dimensionalCheck', 'functionalCheck'],
    POST_PACK: ['packagingCheck', 'labellingCheck'],
  };

  private async generateNumber(companyId: string, stage: string): Promise<string> {
    const count = await this.prisma.oqcInspection.count({ where: { companyId, stage } });
    const year = new Date().getFullYear();
    const prefix = stage === 'POST_PACK' ? 'OQC-POST' : 'OQC-PRE';
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productName: true } },
      fgReceipt: { select: { receiptNumber: true, receivedQty: true } },
    };
  }

  async create(dto: CreateOqcDto, user: any) {
    // Every OQC record must be tied to a real FG Receipt now - without
    // that link there's nothing for release() to credit stock against,
    // and Store's job is specifically to verify a receipt before its
    // stock becomes usable, not to log inspections in the abstract.
    if (!dto.fgReceiptId) throw new BadRequestException('fgReceiptId is required');
    const fgReceipt = await this.prisma.fgReceipt.findFirst({
      where: { id: dto.fgReceiptId, companyId: user.companyId },
    });
    if (!fgReceipt) throw new NotFoundException('FG Receipt not found');
    if (fgReceipt.status !== 'RECEIVED') throw new BadRequestException('FG Receipt must be RECEIVED before OQC can be raised against it');

    const stage = dto.stage;
    const existing = await this.prisma.oqcInspection.findFirst({
      where: { fgReceiptId: dto.fgReceiptId, companyId: user.companyId, stage },
    });
    if (existing) throw new BadRequestException(`OQC ${existing.oqcNumber} already exists for this FG Receipt's ${stage} stage`);

    // POST_PACK only makes sense once PRE_PACK has actually cleared -
    // there's nothing packing-specific to inspect on a lot that was
    // never released from the full-product check in the first place.
    if (stage === 'POST_PACK') {
      const prePack = await this.prisma.oqcInspection.findFirst({
        where: { fgReceiptId: dto.fgReceiptId, companyId: user.companyId, stage: 'PRE_PACK' },
      });
      if (!prePack) throw new BadRequestException('PRE_PACK inspection must exist for this FG Receipt before POST_PACK can be raised');
      if (prePack.status !== 'RELEASED' || prePack.result !== 'PASS') {
        throw new BadRequestException('PRE_PACK inspection must be RELEASED with a PASS result before POST_PACK can be raised');
      }
    }

    // Reject checklist fields that don't belong to this stage instead of
    // silently storing them - see STAGE_FIELDS.
    const otherStage = stage === 'PRE_PACK' ? 'POST_PACK' : 'PRE_PACK';
    for (const field of OqcService.STAGE_FIELDS[otherStage]) {
      if ((dto as any)[field]) {
        throw new BadRequestException(`${field} is not applicable to the ${stage} stage`);
      }
    }

    const oqcNumber = await this.generateNumber(user.companyId, stage);
    const passRate = dto.sampleSize > 0 ? Math.round(dto.passQty / dto.sampleSize * 100) : 0;

    // Auto-determine result if not provided
    let result = dto.result || 'PENDING';
    if (!dto.result && dto.sampleSize > 0) {
      if (dto.failQty === 0) result = 'PASS';
      else if (dto.failQty / dto.sampleSize > 0.1) result = 'FAIL';
      else result = 'CONDITIONAL';
    }

    const oqc = await this.prisma.oqcInspection.create({
      data: {
        oqcNumber, stage, fgReceiptId: dto.fgReceiptId, workOrderId: dto.workOrderId,
        itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom || 'PCS',
        customerName: dto.customerName, lotNumber: dto.lotNumber, batchNumber: dto.batchNumber,
        inspectorName: dto.inspectorName,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
        sampleSize: dto.sampleSize, passQty: dto.passQty, failQty: dto.failQty,
        visualCheck: dto.visualCheck, dimensionalCheck: dto.dimensionalCheck,
        functionalCheck: dto.functionalCheck, packagingCheck: dto.packagingCheck,
        labellingCheck: dto.labellingCheck,
        result, defectsFound: dto.defectsFound, cocNumber: dto.cocNumber,
        status: result === 'PENDING' ? 'PENDING' : 'COMPLETED',
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'oqc_inspections', recordId: oqc.id, action: 'CREATE', newValues: oqc, changedBy: user.id });
    return { ...oqc, passRate };
  }

  async complete(id: string, dto: CompleteOqcDto, user: any) {
    const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId } });
    if (!oqc) throw new NotFoundException('OQC record not found');
    if (oqc.status === 'RELEASED') throw new BadRequestException('Already released');

    const updated = await this.prisma.oqcInspection.update({
      where: { id },
      data: {
        result: dto.result, defectsFound: dto.defectsFound,
        cocNumber: dto.cocNumber, remarks: dto.remarks,
        status: 'COMPLETED', updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'oqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async release(id: string, user: any) {
    const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId } });
    if (!oqc) throw new NotFoundException('OQC record not found');
    if (oqc.result !== 'PASS') throw new BadRequestException('Only PASS inspections can be released for dispatch');
    if (oqc.status !== 'COMPLETED') throw new BadRequestException('Complete inspection before release');

    // Defensive re-check alongside create()'s PRE_PACK dependency: a
    // POST_PACK record can only ever be released once its PRE_PACK
    // sibling is itself RELEASED+PASS, so stock is never credited on
    // one stage alone.
    if (oqc.stage === 'POST_PACK') {
      const prePack = await this.prisma.oqcInspection.findFirst({
        where: { fgReceiptId: oqc.fgReceiptId, companyId: user.companyId, stage: 'PRE_PACK' },
      });
      if (!prePack || prePack.status !== 'RELEASED' || prePack.result !== 'PASS') {
        throw new BadRequestException('PRE_PACK inspection must be RELEASED with a PASS result before POST_PACK can be released');
      }
    }

    const updated = await this.prisma.oqcInspection.update({
      where: { id },
      data: { status: 'RELEASED', releasedBy: user.id, releasedDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });

    // This is the actual Store checkpoint - FG stock becomes visible to
    // StockBalance (and therefore dispatchable, reservable by the next
    // routing stage, etc.) only once BOTH gates have cleared, not from
    // FG Receipt confirmation and not from PRE_PACK release alone.
    // PRE_PACK release never credits stock by itself - there is nothing
    // dispatch-ready about an unpacked lot; POST_PACK release does,
    // now that the guard above has confirmed PRE_PACK already passed.
    if (oqc.stage === 'POST_PACK') {
      await this.stockLedger.receiveFromOqc(id, user);
    }

    await this.audit.log({ tableName: 'oqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // Single source of truth for "is this FG Receipt's lot actually
  // dispatch-ready": BOTH stages must exist, be RELEASED, and have
  // PASSed. Exists specifically so dispatch-readiness is never
  // re-derived ad hoc from a single stage elsewhere.
  async isDispatchReady(fgReceiptId: string, user: any) {
    const inspections = await this.prisma.oqcInspection.findMany({
      where: { fgReceiptId, companyId: user.companyId },
    });
    const prePack = inspections.find((i: any) => i.stage === 'PRE_PACK') || null;
    const postPack = inspections.find((i: any) => i.stage === 'POST_PACK') || null;
    const prePackPassed = !!prePack && prePack.status === 'RELEASED' && prePack.result === 'PASS';
    const postPackPassed = !!postPack && postPack.status === 'RELEASED' && postPack.result === 'PASS';
    return {
      fgReceiptId,
      prePackPassed,
      postPackPassed,
      dispatchReady: prePackPassed && postPackPassed,
      prePack,
      postPack,
    };
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, result, status, stage } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [
      { oqcNumber: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
    if (result) where.result = result;
    if (status) where.status = status;
    if (stage) where.stage = stage;

    const [data, total] = await Promise.all([
      this.prisma.oqcInspection.findMany({
        where, skip, take: Number(limit), orderBy: { inspectionDate: 'desc' },
        include: this.includes(),
      }),
      this.prisma.oqcInspection.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!oqc) throw new NotFoundException('OQC record not found');
    return oqc;
  }

  // Lists FG Receipts still needing OQC action, tagged with which stage
  // is next: PRE_PACK when no inspection has been raised yet, or
  // POST_PACK once PRE_PACK has RELEASED with a PASS. A receipt whose
  // PRE_PACK is still pending/failed, or whose POST_PACK already
  // exists, has nothing left to *create* here, consistent with the
  // pre-split behaviour of only surfacing receipts with real pending
  // action.
  async getPendingFgReceipts(user: any) {
    const companyId = user.companyId;
    const receipts = await this.prisma.fgReceipt.findMany({
      where: { companyId, status: 'RECEIVED' },
      include: { workOrder: { select: { woNumber: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const result = [];
    for (const r of receipts) {
      const inspections = await this.prisma.oqcInspection.findMany({ where: { fgReceiptId: r.id, companyId } });
      const prePack = inspections.find((i: any) => i.stage === 'PRE_PACK');
      const postPack = inspections.find((i: any) => i.stage === 'POST_PACK');
      if (!prePack) {
        result.push({ ...r, nextStage: 'PRE_PACK' });
      } else if (prePack.status === 'RELEASED' && prePack.result === 'PASS' && !postPack) {
        result.push({ ...r, nextStage: 'POST_PACK' });
      }
    }
    return { data: result, total: result.length };
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, pending, completed, released, pass, fail, conditional] = await Promise.all([
      this.prisma.oqcInspection.count({ where }),
      this.prisma.oqcInspection.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.oqcInspection.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.oqcInspection.count({ where: { ...where, status: 'RELEASED' } }),
      this.prisma.oqcInspection.count({ where: { ...where, result: 'PASS' } }),
      this.prisma.oqcInspection.count({ where: { ...where, result: 'FAIL' } }),
      this.prisma.oqcInspection.count({ where: { ...where, result: 'CONDITIONAL' } }),
    ]);
    const totals = await this.prisma.oqcInspection.aggregate({
      where, _sum: { sampleSize: true, passQty: true, failQty: true },
    });
    const passRate = totals._sum.sampleSize > 0 ? Math.round(totals._sum.passQty / totals._sum.sampleSize * 100) : 0;

    const [prePackReleased, postPackReleased] = await Promise.all([
      this.prisma.oqcInspection.count({ where: { ...where, stage: 'PRE_PACK', status: 'RELEASED', result: 'PASS' } }),
      this.prisma.oqcInspection.count({ where: { ...where, stage: 'POST_PACK', status: 'RELEASED', result: 'PASS' } }),
    ]);

    return {
      total, pending, completed, released, pass, fail, conditional, passRate, totalSampled: totals._sum.sampleSize || 0,
      // Dispatch-ready count approximates postPackReleased, since
      // release() never lets a POST_PACK clear without its PRE_PACK
      // sibling already having cleared (see release()'s guard).
      byStage: { prePackReleased, postPackReleased, dispatchReady: postPackReleased },
    };
  }
}
