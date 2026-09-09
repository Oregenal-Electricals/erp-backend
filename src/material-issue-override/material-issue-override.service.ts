import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ProductionMaterialReturnService } from '../production-material-return/production-material-return.service';
import { RequestOverrideDto, DecideOverrideDto } from './dto/material-issue-override.dto';

const DEADLINE_HOURS = 5;

@Injectable()
export class MaterialIssueOverrideService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private workflows: WorkflowsService,
    private materialReturnService: ProductionMaterialReturnService,
  ) {}

  // Requesting an override snapshots the currently-pending items and their
  // outstanding quantities right now - this snapshot is never touched again
  // regardless of what happens next (approve/reject/consume). That's the
  // "never falsifies the original unreconciled amount" guarantee: approving
  // this request grants a one-time exception against exactly this snapshot,
  // it does not edit or clear the underlying reconciliation balance itself.
  async request(dto: RequestOverrideDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const status = await this.materialReturnService.getPreviousMaterialStatus(dto.workOrderId, user);
    if (status.overallStatus !== 'PENDING') {
      throw new BadRequestException('Previous material status is already CLEAR for this work order - no override needed');
    }
    const pendingItems = status.items.filter(i => i.status === 'PENDING');

    const existing = await this.prisma.materialIssueOverride.findFirst({
      where: { companyId: user.companyId, workOrderId: dto.workOrderId, status: 'PENDING', isActive: true },
    });
    if (existing) throw new BadRequestException('An override request is already pending for this work order');

    const deadlineAt = new Date(Date.now() + DEADLINE_HOURS * 60 * 60 * 1000);

    const override = await this.prisma.materialIssueOverride.create({
      data: {
        companyId: user.companyId, workOrderId: dto.workOrderId,
        approvalRequestId: 'pending', // filled in immediately below once the approval request exists
        itemsSnapshot: pendingItems as any,
        reason: dto.reason, requestedById: user.id, deadlineAt,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    const { request: approvalRequest } = await this.workflows.submit({
      documentType: 'MATERIAL_ISSUE_OVERRIDE',
      documentId: override.id,
      documentNumber: `MIO-${override.id.slice(0, 8)}`,
      remarks: dto.reason,
    } as any, user);

    const updated = await this.prisma.materialIssueOverride.update({
      where: { id: override.id },
      data: { approvalRequestId: approvalRequest.id, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'material_issue_overrides', recordId: override.id, action: 'CREATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  async decide(overrideId: string, dto: DecideOverrideDto, user: any) {
    const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId, companyId: user.companyId } });
    if (!override) throw new NotFoundException('Override request not found');
    if (override.status !== 'PENDING') throw new BadRequestException(`Override request is already ${override.status}`);
    if (new Date() > override.deadlineAt) {
      await this.prisma.materialIssueOverride.update({ where: { id: overrideId }, data: { status: 'EXPIRED', updatedBy: user.id } });
      throw new BadRequestException('This override request has expired (past its 5-hour decision window) - a new request is needed');
    }

    await this.workflows.act(override.approvalRequestId, { action: dto.action, comments: dto.comments } as any, user);

    const updated = await this.prisma.materialIssueOverride.update({
      where: { id: overrideId },
      data: {
        status: dto.action, approvedById: user.id, approvedAt: new Date(),
        approverComments: dto.comments, updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'material_issue_overrides', recordId: overrideId, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // Used by ProductionIssueService.create() to check for a usable
  // exception before applying the normal PENDING block. Must be APPROVED,
  // not yet CONSUMED by an earlier issue, and still within its own
  // deadline - an approval does not linger indefinitely.
  async findActiveApprovedOverride(workOrderId: string, user: any) {
    return this.prisma.materialIssueOverride.findFirst({
      where: {
        companyId: user.companyId, workOrderId, status: 'APPROVED',
        isActive: true, deadlineAt: { gt: new Date() },
      },
      orderBy: { approvedAt: 'desc' },
    });
  }

  async consume(overrideId: string, issueId: string, user: any) {
    return this.prisma.materialIssueOverride.update({
      where: { id: overrideId },
      data: { status: 'CONSUMED', consumedByIssueId: issueId, updatedBy: user.id },
    });
  }

  async findPending(user: any) {
    return this.prisma.materialIssueOverride.findMany({
      where: { companyId: user.companyId, status: 'PENDING', isActive: true },
      include: {
        workOrder: { select: { woNumber: true, productName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async findOne(id: string, user: any) {
    const override = await this.prisma.materialIssueOverride.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        workOrder: { select: { woNumber: true, productName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!override) throw new NotFoundException('Override request not found');
    return override;
  }
}
