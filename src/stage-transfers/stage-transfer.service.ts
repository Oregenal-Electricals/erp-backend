import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { GiveTransferDto } from './dto/stage-transfer.dto';

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
