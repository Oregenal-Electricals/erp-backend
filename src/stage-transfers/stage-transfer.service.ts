import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { GiveTransferDto, GiveToQcDto } from './dto/stage-transfer.dto';

const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];

@Injectable()
export class StageTransferService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private includes() {
    return {
      fromWorkOrder: { select: { id: true, woNumber: true, stageName: true, productCode: true, productName: true } },
      toWorkOrder: { select: { id: true, woNumber: true, stageName: true, productCode: true, productName: true } },
      givenBy: { select: { firstName: true, lastName: true } },
      receivedBy: { select: { firstName: true, lastName: true } },
    };
  }

  // PROD-006: Production is stage-wise and must support partial
  // handover between stages - the next stage does not wait for the
  // previous one to finish the full Work Order quantity. This used to
  // require fromWo.status === 'COMPLETED', which forced exactly the
  // full-batch-before-handoff pattern the correction removes. It still
  // doesn't move any stock itself - the material reservation system
  // already does that - this remains a parallel record of who
  // physically handed off what to whom and when.
  async give(dto: GiveTransferDto, user: any) {
    const fromWo = await this.prisma.workOrder.findFirst({ where: { id: dto.fromWorkOrderId, companyId: user.companyId } });
    if (!fromWo) throw new NotFoundException('Source Work Order not found');
    if (!['IN_PROGRESS', 'COMPLETED'].includes(fromWo.status)) {
      throw new BadRequestException('Only a Work Order that is IN PRODUCTION or COMPLETED has output to give');
    }

    const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
    if (!toWo) throw new NotFoundException('Destination Work Order not found');

    // Routing-sequence enforcement (spec sections 20, 53): a stage can
    // only hand over to its own immediate next stage in the chain -
    // never skip ahead (e.g. SMT directly into Assembly, bypassing MI).
    if (fromWo.routingGroupId && toWo.routingGroupId === fromWo.routingGroupId) {
      if (toWo.parentWorkOrderId !== fromWo.id) {
        throw new BadRequestException(`${toWo.woNumber} is not the immediate next stage after ${fromWo.woNumber} in this routing - handover would skip a stage`);
      }
    }

    // Transferable balance check (spec sections 22-23): only good
    // output not already given can be handed over - never the gross
    // completed quantity as a whole, and never more than once across
    // repeated handovers.
    const transferable = fromWo.completedQty - fromWo.cumulativeHandoverQty;
    const qty = dto.qty ?? transferable;
    if (qty <= 0) throw new BadRequestException('No transferable quantity available to hand over');
    if (qty > transferable) {
      throw new BadRequestException(`Cannot give ${qty} - only ${transferable} is transferable (${fromWo.completedQty} completed minus ${fromWo.cumulativeHandoverQty} already given)`);
    }

    // Concurrency-safe (spec section 56): the actual guard against two
    // simultaneous handovers together exceeding the transferable
    // balance is this atomic conditional update, not the read-check
    // above (which only produces a friendly error message for the
    // common case) - the WHERE clause re-verifies the balance at the
    // database level in the same statement that applies the increment.
    const updated = await this.prisma.$executeRaw`
      UPDATE work_orders SET "cumulativeHandoverQty" = "cumulativeHandoverQty" + ${qty}, "updatedBy" = ${user.id}
      WHERE id = ${fromWo.id} AND "completedQty" - "cumulativeHandoverQty" >= ${qty}
    `;
    if (updated === 0) {
      throw new BadRequestException('Transferable quantity changed since this was checked - please retry');
    }

    const note = await this.prisma.stageTransferNote.create({
      data: {
        companyId: user.companyId,
        fromWorkOrderId: dto.fromWorkOrderId, toWorkOrderId: dto.toWorkOrderId,
        itemCode: fromWo.productCode, itemName: fromWo.productName,
        qty, remarks: dto.remarks,
        givenByUserId: user.id,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // The handover itself is what unlocks downstream readiness (spec
    // manual test 3) - receive() below remains available as a
    // lightweight physical-acknowledgment step, but does not gate
    // availability, since the spec's own tests never require a
    // separate receive action before the next stage can start.
    await this.prisma.workOrder.update({
      where: { id: toWo.id },
      data: {
        cumulativeInputQty: { increment: qty },
        stageStatus: toWo.stageStatus === 'NOT_READY' ? 'READY_FOR_START' : toWo.stageStatus,
        updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'stage_transfer_notes', recordId: note.id, action: 'CREATE', newValues: note, changedBy: user.id });
    return note;
  }

  // PROD-013: final production stage handover to Production QC.
  // Reuses the exact same transferable-balance/concurrency mechanics as
  // give() above - the "next destination" for a WO's output is either
  // another routing stage or QC, never both, so cumulativeHandoverQty
  // is the correct running total for either case without a parallel
  // field. QC handover never touches FgReceipt/inventory at all (spec
  // section 23) - it only creates a StageTransferNote and a PENDING
  // ProductionQc row for PROD-014 to later decide on.
  async giveToQc(dto: GiveToQcDto, user: any) {
    const fromWo = await this.prisma.workOrder.findFirst({ where: { id: dto.fromWorkOrderId, companyId: user.companyId } });
    if (!fromWo) throw new NotFoundException('Source Work Order not found');
    if (!['IN_PROGRESS', 'COMPLETED'].includes(fromWo.status)) {
      throw new BadRequestException('Only a Work Order that is IN PRODUCTION or COMPLETED has output to hand to QC');
    }

    // Final production stage validation (spec sections 3, 32-34): only
    // the routing's last operation may hand normal completed quantity
    // to Production QC. Aging falls out of this same rule naturally -
    // if Aging exists in the routing it IS the last stage, so a
    // handover attempt from the stage before it is correctly blocked
    // without any separate Aging-specific logic.
    if (fromWo.routingGroupId) {
      const routingStages = await this.prisma.routingStage.findMany({ where: { routingId: fromWo.routingGroupId, isActive: true } });
      const thisStage = routingStages.find((s: any) => s.stageName === fromWo.stageName);
      if (thisStage && routingStages.length > 0) {
        const maxSequence = Math.max(...routingStages.map((s: any) => s.sequence));
        if (thisStage.sequence !== maxSequence) {
          throw new BadRequestException(`${fromWo.stageName} is not the final production stage in this routing - QC handover is only valid from the last operation`);
        }
      }
    }

    const transferable = fromWo.completedQty - fromWo.cumulativeHandoverQty;
    const qty = dto.qty ?? transferable;
    if (qty <= 0) throw new BadRequestException('No transferable quantity available to hand over to QC');
    if (qty > transferable) {
      throw new BadRequestException(`Cannot give ${qty} to QC - only ${transferable} is transferable (${fromWo.completedQty} completed minus ${fromWo.cumulativeHandoverQty} already given)`);
    }

    const updated = await this.prisma.$executeRaw`
      UPDATE work_orders SET "cumulativeHandoverQty" = "cumulativeHandoverQty" + ${qty}, "updatedBy" = ${user.id}
      WHERE id = ${fromWo.id} AND "completedQty" - "cumulativeHandoverQty" >= ${qty}
    `;
    if (updated === 0) {
      throw new BadRequestException('Transferable quantity changed since this was checked - please retry');
    }

    const note = await this.prisma.stageTransferNote.create({
      data: {
        companyId: user.companyId,
        fromWorkOrderId: dto.fromWorkOrderId, toWorkOrderId: null, isQcHandover: true,
        batchLot: dto.batchLot,
        itemCode: fromWo.productCode, itemName: fromWo.productName,
        qty, remarks: dto.remarks,
        givenByUserId: user.id,
        createdBy: user.id, updatedBy: user.id,
      },
      include: this.includes(),
    });

    // QC-pending record (spec section 18): result/status must NOT
    // default to a decision - PROD-014 owns Accept/Reject/Rework. The
    // model's sampleSize field doubles as "quantity handed for
    // inspection" here, since ProductionQc has no dedicated handover-
    // quantity field of its own.
    const qcCount = await this.prisma.productionQc.count({ where: { companyId: user.companyId } });
    const qcNumber = `QC-${new Date().getFullYear()}-${String(qcCount + 1).padStart(4, '0')}`;
    await this.prisma.productionQc.create({
      data: {
        companyId: user.companyId, qcNumber, workOrderId: dto.fromWorkOrderId,
        inspectionStage: 'FINAL', result: 'PENDING', status: 'PENDING',
        sampleSize: qty,
        remarks: dto.batchLot ? `Batch/Lot: ${dto.batchLot}` : dto.remarks,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'stage_transfer_notes', recordId: note.id, action: 'CREATE', newValues: { ...note, isQcHandover: true }, changedBy: user.id });
    return note;
  }

  async receive(id: string, user: any) {
    const note = await this.prisma.stageTransferNote.findFirst({ where: { id, companyId: user.companyId } });
    if (!note) throw new NotFoundException('Transfer note not found');
    if (note.status === 'RECEIVED') throw new BadRequestException('This transfer has already been received');
    const updated = await this.prisma.stageTransferNote.update({
      where: { id },
      data: { status: 'RECEIVED', receivedByUserId: user.id, receivedAt: new Date(), updatedBy: user.id },
      include: this.includes(),
    });
    await this.audit.log({ tableName: 'stage_transfer_notes', recordId: id, action: 'UPDATE', newValues: { status: 'RECEIVED' }, changedBy: user.id });
    return updated;
  }

  async findAll(user: any, query: any) {
    const { status, pending } = query;
    const where: any = { companyId: user.companyId, isActive: true };
    if (status) where.status = status;
    if (pending === 'true') where.status = 'PENDING';
    if (!SUPERVISOR_ROLES.includes(user.role)) {
      where.OR = [
        { givenByUserId: user.id },
        { receivedByUserId: user.id },
        { fromWorkOrder: { stageName: user.assignedStage || '__none__' } },
        { toWorkOrder: { stageName: user.assignedStage || '__none__' } },
      ];
    }
    return this.prisma.stageTransferNote.findMany({
      where, include: this.includes(), orderBy: { givenAt: 'desc' },
    });
  }
}
