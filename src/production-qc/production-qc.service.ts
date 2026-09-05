import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionQcDto, CompleteQcDto, DecideQcDto } from './dto/production-qc.dto';
import { WorkOrderService } from '../work-orders/work-order.service';

@Injectable()
export class ProductionQcService {
  constructor(private prisma: PrismaService, private audit: AuditService, private workOrderService: WorkOrderService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.productionQc.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `PQC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true } },
      productionEntry: { select: { entryNumber: true, shift: true, goodQty: true } },
    };
  }

  async create(dto: CreateProductionQcDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const qcNumber = await this.generateNumber(user.companyId);
    const passRate = dto.sampleSize > 0 ? Math.round((dto.passQty / dto.sampleSize) * 100) : 0;

    const qc = await this.prisma.productionQc.create({
      data: {
        qcNumber, workOrderId: dto.workOrderId,
        productionEntryId: dto.productionEntryId,
        inspectionStage: dto.inspectionStage || 'IN_PROCESS',
        inspectorName: dto.inspectorName,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
        sampleSize: dto.sampleSize, passQty: dto.passQty, failQty: dto.failQty,
        defectDescription: dto.defectDescription,
        correctiveAction: dto.correctiveAction,
        remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'production_qc', recordId: qc.id, action: 'CREATE', newValues: qc, changedBy: user.id });
    return { ...qc, passRate };
  }

  async complete(id: string, dto: CompleteQcDto, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId } });
    if (!qc) throw new NotFoundException('QC record not found');
    if (qc.status === 'COMPLETED') throw new BadRequestException('Already completed');

    const updated = await this.prisma.productionQc.update({
      where: { id },
      data: {
        result: dto.result, status: 'COMPLETED',
        defectDescription: dto.defectDescription || qc.defectDescription,
        correctiveAction: dto.correctiveAction || qc.correctiveAction,
        remarks: dto.remarks || qc.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'production_qc', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });

    // A FAIL is a real quality gate, not just a record - immediately halt
    // further production on this Work Order (same as a manual Stop, no
    // approval needed to stop - it's a reactive floor decision). Resuming
    // it already requires Plant Head approval via the existing WO Restart
    // workflow gate, so a failed in-process inspection can't be silently
    // worked past. Wrapped defensively so a WO that's already moved on to
    // some other state (completed/cancelled through a separate action)
    // doesn't block recording the QC result itself.
    if (dto.result === 'FAIL') {
      try {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: qc.workOrderId, companyId: user.companyId } });
        if (wo && wo.status === 'IN_PROGRESS') {
          await this.workOrderService.stop(qc.workOrderId, user);
        }
      } catch (e) {
        // don't fail the QC completion itself if the WO couldn't be stopped
      }
    }

    return updated;
  }

  // PROD-014: quantity-based mixed disposition for a FINAL-stage
  // inspection created by PROD-013's giveToQc(). Deliberately a
  // separate method from complete() above - that method's FAIL branch
  // stops the WO outright, which is correct for an in-process (IPQC)
  // single-verdict inspection but wrong here, since a final QC
  // decision routinely mixes accepted/rework/reject in one handover
  // without implying production itself must stop.
  async decideQuantities(id: string, dto: DecideQcDto, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId } });
    if (!qc) throw new NotFoundException('QC record not found');
    if (qc.status === 'COMPLETED') throw new BadRequestException('This QC inspection has already been decided');

    const holdQty = dto.holdQty || 0;
    const total = dto.acceptedQty + dto.reworkQty + dto.rejectedQty + holdQty;
    if (total < qc.sampleSize) {
      throw new BadRequestException(`Unreconciled quantity: ${qc.sampleSize - total} pcs inspected but not accounted for in accepted/rework/reject/hold`);
    }
    if (total > qc.sampleSize) {
      throw new BadRequestException(`Disposition total (${total}) exceeds inspected quantity (${qc.sampleSize}) by ${total - qc.sampleSize}`);
    }

    // Overall result is derived, not entered directly - kept consistent
    // with the single-verdict result field the in-process flow already
    // uses, so existing stats/filters (getStats() below) still work
    // sensibly across both flows.
    const result = dto.acceptedQty === qc.sampleSize ? 'PASS' : dto.rejectedQty === qc.sampleSize ? 'FAIL' : 'CONDITIONAL';

    const updated = await this.prisma.productionQc.update({
      where: { id },
      data: {
        acceptedQty: dto.acceptedQty, reworkQty: dto.reworkQty, failQty: dto.rejectedQty, holdQty,
        result, status: 'COMPLETED',
        defectDescription: dto.defectDescription || qc.defectDescription,
        remarks: dto.remarks || qc.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });

    // Rework/reject traceability via the existing NCR mechanism (spec
    // sections 23-27) - reused rather than building a parallel defect-
    // tracking system. PROD-015/016 own the actual rework/scrap
    // execution; this only creates the reference for them to act on.
    if (dto.reworkQty > 0 || dto.rejectedQty > 0) {
      const ncrCount = await this.prisma.ncrRecord.count({ where: { companyId: user.companyId } });
      const ncrNumber = `NCR-${new Date().getFullYear()}-${String(ncrCount + 1).padStart(4, '0')}`;
      await this.prisma.ncrRecord.create({
        data: {
          companyId: user.companyId, ncrNumber, source: 'OQC',
          sourceReferenceId: qc.id, sourceReferenceNumber: qc.qcNumber,
          workOrderId: qc.workOrderId, description: dto.defectDescription || `QC rework/reject from ${qc.qcNumber}`,
          qtyAffected: dto.reworkQty + dto.rejectedQty,
          disposition: dto.reworkQty > 0 && dto.rejectedQty === 0 ? 'REWORK' : undefined,
          createdBy: user.id, updatedBy: user.id,
        },
      });
    }

    // Bug found via manual UAT: completing a rework's re-inspection
    // never closed the originating Rework record, permanently blocking
    // WO closure on "rework not yet resolved" even after QC decided.
    // The Rework's own lifecycle ends here regardless of outcome - a
    // Rework Again disposition creates a brand new cycle-2 Rework
    // record rather than reopening this one, so closing it now never
    // loses history.
    if (qc.sourceReworkId) {
      await this.prisma.rework.update({
        where: { id: qc.sourceReworkId },
        data: { status: 'CLOSED', updatedBy: user.id },
      });
    }

    await this.audit.log({ tableName: 'production_qc', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, result, workOrderId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    if (search) where.OR = [{ qcNumber: { contains: search, mode: 'insensitive' } }];
    if (result) where.result = result;
    if (workOrderId) where.workOrderId = workOrderId;

    const [data, total] = await Promise.all([
      this.prisma.productionQc.findMany({
        where, skip, take: Number(limit), orderBy: { inspectionDate: 'desc' },
        include: this.includes(),
      }),
      this.prisma.productionQc.count({ where }),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!qc) throw new NotFoundException('QC record not found');
    return qc;
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role !== 'SUPER_ADMIN') where.companyId = user.companyId;
    const [total, pending, completed, passed, failed, conditional] = await Promise.all([
      this.prisma.productionQc.count({ where }),
      this.prisma.productionQc.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.productionQc.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'PASS' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'FAIL' } }),
      this.prisma.productionQc.count({ where: { ...where, result: 'CONDITIONAL' } }),
    ]);
    const totals = await this.prisma.productionQc.aggregate({ where, _sum: { sampleSize: true, passQty: true, failQty: true } });
    const passRate = totals._sum.sampleSize > 0 ? Math.round(totals._sum.passQty / totals._sum.sampleSize * 100) : 0;
    return { total, pending, completed, passed, failed, conditional, passRate, totalSampled: totals._sum.sampleSize || 0 };
  }
}
