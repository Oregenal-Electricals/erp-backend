import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateOqcDto, CompleteOqcDto } from './dto/oqc.dto';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';

@Injectable()
export class OqcService {
  constructor(private prisma: PrismaService, private audit: AuditService, private stockLedger: StockLedgerService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.oqcInspection.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `OQC-${year}-${String(count + 1).padStart(4, '0')}`;
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
    const existing = await this.prisma.oqcInspection.findFirst({
      where: { fgReceiptId: dto.fgReceiptId, companyId: user.companyId },
    });
    if (existing) throw new BadRequestException(`OQC ${existing.oqcNumber} already exists for this FG Receipt`);

    const oqcNumber = await this.generateNumber(user.companyId);
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
        oqcNumber, fgReceiptId: dto.fgReceiptId, workOrderId: dto.workOrderId,
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

    const updated = await this.prisma.oqcInspection.update({
      where: { id },
      data: { status: 'RELEASED', releasedBy: user.id, releasedDate: new Date(), updatedBy: user.id },
      include: this.includes(),
    });

    // This is the actual Store checkpoint - FG stock becomes visible to
    // StockBalance (and therefore dispatchable, reservable by the next
    // routing stage, etc.) only from this point on, not from FG Receipt
    // confirmation.
    await this.stockLedger.receiveFromOqc(id, user);

    await this.audit.log({ tableName: 'oqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, result, status } = query;
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

  async getPendingFgReceipts(user: any) {
    const companyId = user.companyId;
    const receipts = await this.prisma.fgReceipt.findMany({
      where: { companyId, status: 'RECEIVED' },
      include: { workOrder: { select: { woNumber: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const result = [];
    for (const r of receipts) {
      const oqc = await this.prisma.oqcInspection.findFirst({ where: { fgReceiptId: r.id, companyId } });
      if (!oqc) result.push(r);
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
    return { total, pending, completed, released, pass, fail, conditional, passRate, totalSampled: totals._sum.sampleSize || 0 };
  }
}
