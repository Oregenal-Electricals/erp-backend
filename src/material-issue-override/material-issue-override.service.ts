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
  //
  // STORE-012 sections 10, 22: scoped to one specific material within the
  // WO - an unrelated pending material must not be blocked by, or block,
  // this one's exception. requestedQty is captured here so a later
  // approval can be partial (sections 18, 20) against a known ask.
  async request(dto: RequestOverrideDto, user: any) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const status = await this.materialReturnService.getPreviousMaterialStatus(dto.workOrderId, user);
    const item = status.items.find(i => i.itemCode === dto.itemCode);
    if (!item || item.status !== 'PENDING') {
      throw new BadRequestException(`Previous material status for ${dto.itemCode} is already CLEAR on this work order - no override needed`);
    }

    const existing = await this.prisma.materialIssueOverride.findFirst({
      where: { companyId: user.companyId, workOrderId: dto.workOrderId, itemCode: dto.itemCode, status: 'PENDING', isActive: true },
    });
    if (existing) throw new BadRequestException(`An override request is already pending for ${dto.itemCode} on this work order`);

    const deadlineAt = new Date(Date.now() + DEADLINE_HOURS * 60 * 60 * 1000);

    const override = await this.prisma.materialIssueOverride.create({
      data: {
        companyId: user.companyId, workOrderId: dto.workOrderId,
        itemCode: dto.itemCode, itemName: dto.itemName, requestedQty: dto.requestedQty,
        approvalRequestId: 'pending', // filled in immediately below once the approval request exists
        itemsSnapshot: [item] as any,
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

  // STORE-012 sections 20, 23-24: approvedQty may be less than
  // requestedQty (partial approval) - never more. Required when
  // approving; irrelevant (and ignored) on rejection.
  async decide(overrideId: string, dto: DecideOverrideDto, user: any) {
    const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId, companyId: user.companyId } });
    if (!override) throw new NotFoundException('Override request not found');
    if (override.status !== 'PENDING') throw new BadRequestException(`Override request is already ${override.status}`);
    if (new Date() > override.deadlineAt) {
      await this.prisma.materialIssueOverride.update({ where: { id: overrideId }, data: { status: 'EXPIRED', updatedBy: user.id } });
      throw new BadRequestException('This override request has expired (past its 5-hour decision window) - a new request is needed');
    }

    let approvedQty: number | null = null;
    if (dto.action === 'APPROVED') {
      approvedQty = dto.approvedQty ?? override.requestedQty;
      if (approvedQty <= 0) throw new BadRequestException('Approved quantity must be greater than 0');
      if (approvedQty > override.requestedQty) {
        throw new BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${override.requestedQty})`);
      }
    }

    await this.workflows.act(override.approvalRequestId, { action: dto.action, comments: dto.comments } as any, user);

    const updated = await this.prisma.materialIssueOverride.update({
      where: { id: overrideId },
      data: {
        status: dto.action, approvedById: user.id, approvedAt: new Date(),
        approvedQty: approvedQty ?? undefined,
        approverComments: dto.comments, updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'material_issue_overrides', recordId: overrideId, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // Used by ProductionIssueService.create() to check for a usable
  // exception before applying the normal PENDING block, scoped to this
  // specific WO+material. Must be APPROVED, still within its 5-hour
  // decision window, and have remaining unused approved capacity -
  // an override may now be drawn on across more than one issue as long
  // as capacity remains (sections 23-24), never fully "spent" until
  // usedQty reaches approvedQty.
  async findActiveApprovedOverride(workOrderId: string, itemCode: string, user: any) {
    const candidates = await this.prisma.materialIssueOverride.findMany({
      where: {
        companyId: user.companyId, workOrderId, itemCode, status: 'APPROVED',
        isActive: true, deadlineAt: { gt: new Date() },
      },
      orderBy: { approvedAt: 'asc' },
    });
    return candidates.find(o => (o.approvedQty || 0) - o.usedQty > 0.0001) || null;
  }

  // Atomically claims up to wantQty from an override's remaining
  // capacity (approvedQty - usedQty). Retries with a fresh read if a
  // concurrent issue changed usedQty in between, rather than ever
  // letting two simultaneous issues both draw the same capacity
  // (section 59, 84). Marks CONSUMED once capacity reaches zero.
  // Returns however much was actually claimed - the caller must treat
  // a shortfall as a hard block, never a silent partial issue.
  async consume(overrideId: string, issueId: string, wantQty: number, user: any): Promise<number> {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId } });
      if (!override || override.status !== 'APPROVED') return 0;
      const remaining = Math.max(0, (override.approvedQty || 0) - override.usedQty);
      const claimQty = Math.min(remaining, wantQty);
      if (claimQty <= 0.0001) return 0;

      const newUsedQty = override.usedQty + claimQty;
      const nowConsumed = newUsedQty >= (override.approvedQty || 0) - 0.0001;

      const claim = await this.prisma.materialIssueOverride.updateMany({
        where: { id: overrideId, usedQty: override.usedQty },
        data: {
          usedQty: newUsedQty,
          status: nowConsumed ? 'CONSUMED' : 'APPROVED',
          consumedByIssueId: nowConsumed ? issueId : override.consumedByIssueId,
          updatedBy: user.id,
        },
      });
      if (claim.count === 1) return claimQty;
      // Someone else changed usedQty in between - loop retries with a fresh read.
    }
    throw new BadRequestException('Could not consume override capacity - too many concurrent updates, please retry.');
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
