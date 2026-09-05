import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateReworkDto, StartReworkDto, CompleteReworkDto } from './dto/rework.dto';

@Injectable()
export class ReworkService {
  constructor(private prisma: PrismaService, private audit: AuditService, private settings: SettingsService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.rework.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `RW-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private includes() {
    return {
      workOrder: { select: { woNumber: true, productCode: true, productName: true } },
      originalQcInspection: { select: { qcNumber: true } },
    };
  }

  // PROD-015: rework is a controlled correction pass on quantity that
  // already carries accumulated cost - never fresh production. Quantity
  // is bounded by what's actually still available from the originating
  // QC inspection's reworkQty, minus whatever prior Rework records
  // already claimed from it (spec section 11), the same transferable-
  // balance pattern used throughout PROD-006/008/013.
  async create(dto: CreateReworkDto, user: any) {
    const qc = await this.prisma.productionQc.findFirst({ where: { id: dto.originalQcInspectionId, companyId: user.companyId } });
    if (!qc) throw new NotFoundException('Original QC inspection not found');
    if (qc.reworkQty <= 0) throw new BadRequestException('This QC inspection has no rework-pending quantity');

    const existingReworks = await this.prisma.rework.findMany({
      where: { companyId: user.companyId, originalQcInspectionId: dto.originalQcInspectionId, isActive: true },
    });
    const alreadyClaimed = existingReworks.reduce((sum, r) => sum + r.quantity, 0);
    const available = qc.reworkQty - alreadyClaimed;
    if (dto.quantity > available) {
      throw new BadRequestException(`Cannot create rework for ${dto.quantity} - only ${available} rework-pending quantity is available from this QC inspection`);
    }

    const reworkNumber = await this.generateNumber(user.companyId);
    const rework = await this.prisma.rework.create({
      data: {
        companyId: user.companyId, reworkNumber, workOrderId: dto.workOrderId,
        originalQcInspectionId: dto.originalQcInspectionId,
        defectDescription: dto.defectDescription, reworkStage: dto.reworkStage,
        quantity: dto.quantity, remainingQuantity: dto.quantity,
        cycleNumber: 1, status: 'REWORK_PENDING', remarks: dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'reworks', recordId: rework.id, action: 'CREATE', newValues: rework, changedBy: user.id });
    return rework;
  }

  // Quantity-based manpower (spec section 14) - no Employee IDs.
  // Manpower must come from valid existing production manpower capacity
  // (spec section 15) - this deliberately does not create a new
  // allocation; it's the caller's responsibility to have a valid
  // approved allocation on the WO already (via PROD-003/004/005/008/009).
  async start(id: string, dto: StartReworkDto, user: any) {
    const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId } });
    if (!rework) throw new NotFoundException('Rework record not found');
    if (rework.status !== 'REWORK_PENDING') throw new BadRequestException(`Rework is ${rework.status}, not REWORK_PENDING`);

    const updated = await this.prisma.rework.update({
      where: { id },
      data: { status: 'IN_REWORK', manpowerQty: dto.manpowerQty, actualStartAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });

    await this.audit.log({ tableName: 'reworks', recordId: id, action: 'UPDATE', newValues: { status: 'IN_REWORK' }, changedBy: user.id });
    return updated;
  }

  // PROD-015's core reconciliation + costing + QC re-handover, all in
  // one atomic step (spec sections 29-33, 71). Successfully reworked
  // quantity never becomes accepted directly - it always goes back
  // through PROD-014's own decideQuantities() via a brand new
  // ProductionQc row, the same accept/rework-again/reject decision
  // path original production output already uses (spec sections 32-33,
  // 35-37) - no separate "rework acceptance" mechanism was built.
  async complete(id: string, dto: CompleteReworkDto, user: any) {
    const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId }, include: { workOrder: true } });
    if (!rework) throw new NotFoundException('Rework record not found');
    if (rework.status !== 'IN_REWORK') throw new BadRequestException(`Rework is ${rework.status}, not IN_REWORK`);

    const total = dto.successfullyReworkedQty + dto.stillDefectiveQty;
    if (total !== rework.quantity) {
      if (total < rework.quantity) {
        throw new BadRequestException(`Unreconciled quantity: ${rework.quantity - total} pcs of rework input not accounted for`);
      }
      throw new BadRequestException(`Disposition total (${total}) exceeds rework input (${rework.quantity}) by ${total - rework.quantity}`);
    }

    // Actual rework labour cost - same manpower x duration x rate
    // formula PROD-007 already established, reused rather than
    // reinvented. Carries the same "flat number, not a true segmented
    // timeline" caveat already documented for every other costing
    // calculation in this spec series since PROD-008.
    const actualEndAt = new Date();
    let additionalLabourCost = 0;
    if (rework.actualStartAt && rework.manpowerQty) {
      const durationHours = (actualEndAt.getTime() - rework.actualStartAt.getTime()) / (1000 * 60 * 60);
      const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
      const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
      if (rate > 0) {
        additionalLabourCost = Math.round(rework.manpowerQty * durationHours * (rate / shiftHours) * 100) / 100;
      }
    }
    const additionalMaterialCost = dto.additionalMaterialCost || 0;
    const additionalOtherCost = dto.additionalOtherCost || 0;
    const totalAdditionalCost = additionalLabourCost + additionalMaterialCost + additionalOtherCost;

    const updated = await this.prisma.rework.update({
      where: { id },
      data: {
        status: 'PENDING_QC_REINSPECTION',
        successfullyReworkedQty: dto.successfullyReworkedQty, stillDefectiveQty: dto.stillDefectiveQty,
        remainingQuantity: 0, actualEndAt,
        additionalLabourCost, additionalMaterialCost, additionalOtherCost, totalAdditionalCost,
        remarks: dto.remarks || rework.remarks,
        updatedBy: user.id,
      },
      include: this.includes(),
    });

    // QC re-inspection handover: a new PENDING ProductionQc row, only
    // for the quantity that was successfully reworked - never the
    // still-defective portion, which stays with the rework record
    // itself pending a later, separate authorized disposition (spec
    // section 42, PROD-016 scope).
    if (dto.successfullyReworkedQty > 0) {
      const qcCount = await this.prisma.productionQc.count({ where: { companyId: user.companyId } });
      const qcNumber = `QC-${new Date().getFullYear()}-${String(qcCount + 1).padStart(4, '0')}`;
      await this.prisma.productionQc.create({
        data: {
          companyId: user.companyId, qcNumber, workOrderId: rework.workOrderId,
          inspectionStage: 'FINAL', result: 'PENDING', status: 'PENDING',
          sampleSize: dto.successfullyReworkedQty,
          // Real link (not just the text remark below) so
          // ProductionQcService.decideQuantities() can close this
          // Rework once its re-inspection completes - found missing
          // via manual UAT, which left closure permanently blocked on
          // "not yet resolved" even after QC accepted the rework output.
          sourceReworkId: rework.id,
          remarks: `Rework re-inspection - ${rework.reworkNumber}, cycle ${rework.cycleNumber}`,
          createdBy: user.id, updatedBy: user.id,
        },
      });
    }

    await this.audit.log({
      tableName: 'reworks', recordId: id, action: 'UPDATE',
      newValues: { status: 'PENDING_QC_REINSPECTION', successfullyReworkedQty: dto.successfullyReworkedQty, stillDefectiveQty: dto.stillDefectiveQty, totalAdditionalCost },
      changedBy: user.id,
    });

    return updated;
  }

  async findAll(user: any, query: any) {
    const { workOrderId, status } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (workOrderId) where.workOrderId = workOrderId;
    if (status) where.status = status;
    return this.prisma.rework.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, user: any) {
    const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
    if (!rework) throw new NotFoundException('Rework record not found');
    return rework;
  }
}
