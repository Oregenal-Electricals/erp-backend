import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateScrapDto, DispositionScrapDto } from './dto/scrap.dto';

@Injectable()
export class ScrapService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.scrap.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `FR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true } },
      sourceQcInspection: { select: { qcNumber: true } },
      sourceRework: { select: { reworkNumber: true, cycleNumber: true } },
    };
  }

  // PROD-016: final rejection is quantity claimed against a QC
  // inspection's failQty - always failQty regardless of whether the
  // source inspection was a first-pass PROD-014 decision or a
  // PROD-015 rework re-inspection, since both are the same
  // ProductionQc model and both use the same field for rejected
  // quantity. sourceReworkId is carried separately purely for
  // traceability (spec section 4/29), not for the quantity math.
  async create(dto: CreateScrapDto, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id: dto.sourceQcInspectionId, companyId: user.companyId } });
    if (!qc) throw new NotFoundException('Source QC inspection not found');
    if (qc.failQty <= 0) throw new BadRequestException('This QC inspection has no rejected quantity');

    const existingScraps = await this.prisma.scrap.findMany({
      where: { companyId: user.companyId, sourceQcInspectionId: dto.sourceQcInspectionId, isActive: true },
    });
    const alreadyClaimed = existingScraps.reduce((sum, s) => sum + s.quantity, 0);
    const available = qc.failQty - alreadyClaimed;
    if (dto.quantity > available) {
      throw new BadRequestException(`Cannot create final rejection for ${dto.quantity} - only ${available} rejected quantity is available from this QC inspection`);
    }

    const rejectionNumber = await this.generateNumber(user.companyId);
    const scrap = await this.prisma.scrap.create({
      data: {
        companyId: user.companyId, rejectionNumber, workOrderId: dto.workOrderId,
        sourceQcInspectionId: dto.sourceQcInspectionId, sourceReworkId: dto.sourceReworkId,
        defectDescription: dto.defectDescription, quantity: dto.quantity,
        status: 'PENDING_DISPOSITION', remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'scraps', recordId: scrap.id, action: 'CREATE', newValues: scrap, changedBy: user.id });
    return scrap;
  }

  // Disposition reconciliation (spec sections 9-12): supports partial
  // and multiple dispositions by being callable more than once - each
  // call adds to the running scrapQty/recoveryQty/otherDispositionQty
  // totals rather than replacing them, and the combined total across
  // however many calls can never exceed the rejection's own quantity.
  // Cost is never deleted: recognizedScrapRecovery only ever
  // increases the recorded offset, it never touches the WO's own
  // original production/rework cost fields (spec sections 3, 22, 28).
  async disposition(id: string, dto: DispositionScrapDto, user: any) {
    const scrap = await this.prisma.scrap.findFirst({ where: { id, companyId: user.companyId } });
    if (!scrap) throw new NotFoundException('Final rejection record not found');
    if (scrap.status === 'DISPOSITION_COMPLETED') throw new BadRequestException('This final rejection has already been fully dispositioned');

    const otherDispositionQty = dto.otherDispositionQty || 0;
    const newTotal = scrap.scrapQty + scrap.recoveryQty + scrap.otherDispositionQty + dto.scrapQty + dto.recoveryQty + otherDispositionQty;
    if (newTotal > scrap.quantity) {
      throw new BadRequestException(`Disposition total (${newTotal}) exceeds final rejection quantity (${scrap.quantity}) by ${newTotal - scrap.quantity}`);
    }

    const updatedScrapQty = scrap.scrapQty + dto.scrapQty;
    const updatedRecoveryQty = scrap.recoveryQty + dto.recoveryQty;
    const updatedOtherQty = scrap.otherDispositionQty + otherDispositionQty;
    const pendingDisposition = scrap.quantity - (updatedScrapQty + updatedRecoveryQty + updatedOtherQty);

    const updated = await this.prisma.scrap.update({
      where: { id },
      data: {
        scrapQty: updatedScrapQty, recoveryQty: updatedRecoveryQty, otherDispositionQty: updatedOtherQty,
        status: pendingDisposition === 0 ? 'DISPOSITION_COMPLETED' : 'PENDING_DISPOSITION',
        estimatedScrapValue: dto.estimatedScrapValue !== undefined ? dto.estimatedScrapValue : scrap.estimatedScrapValue,
        // Only ever accumulates - a second disposition call adds to
        // recognized recovery, it never resets a prior recognized
        // amount to a smaller one (that would need a correction path,
        // not a normal disposition call).
        recognizedScrapRecovery: scrap.recognizedScrapRecovery + (dto.recognizedScrapRecovery || 0),
        recoveredComponents: dto.recoveredComponents || scrap.recoveredComponents,
        remarks: dto.remarks || scrap.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({
      tableName: 'scraps', recordId: id, action: 'UPDATE',
      newValues: { scrapQty: updatedScrapQty, recoveryQty: updatedRecoveryQty, otherDispositionQty: updatedOtherQty, recognizedScrapRecovery: updated.recognizedScrapRecovery },
      changedBy: user.id,
    });

    return updated;
  }

  async findAll(user: any, query: any) {
    const { workOrderId, status } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (workOrderId) where.workOrderId = workOrderId;
    if (status) where.status = status;
    return this.prisma.scrap.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, user: any) {
    const scrap = await this.prisma.scrap.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!scrap) throw new NotFoundException('Final rejection record not found');
    return scrap;
  }
}
