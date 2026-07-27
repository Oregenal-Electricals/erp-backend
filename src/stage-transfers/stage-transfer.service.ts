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

  // Makes the handoff between stages an explicit, visible action instead of
  // it happening invisibly through automatic BOM-based material
  // consumption. This doesn't move any stock itself - the material
  // reservation system already does that - it's a parallel record of who
  // physically handed off what to whom and when, which either side must
  // acknowledge.
  async give(dto: GiveTransferDto, user: any) {
    const fromWo = await this.prisma.workOrder.findFirst({ where: { id: dto.fromWorkOrderId, companyId: user.companyId } });
    if (!fromWo) throw new NotFoundException('Source Work Order not found');
    if (fromWo.status !== 'COMPLETED') throw new BadRequestException('Only a completed Work Order has finished goods to give');

    const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
    if (!toWo) throw new NotFoundException('Destination Work Order not found');

    const qty = dto.qty || fromWo.completedQty;
    if (qty > fromWo.completedQty) throw new BadRequestException(`Cannot give more than the ${fromWo.completedQty} units this Work Order actually completed`);

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
