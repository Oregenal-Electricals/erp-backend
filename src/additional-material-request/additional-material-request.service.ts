import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { RequestAdditionalMaterialDto, DecideAdditionalMaterialDto } from './dto/additional-material-request.dto';

@Injectable()
export class AdditionalMaterialRequestService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private workflows: WorkflowsService,
  ) {}

  // STORE-013 sections 2-4, 6: the line between "still within the
  // original approved WO requirement" and "genuinely additional
  // material" - computed fresh each time from the WO's own BOM ratio
  // and the sum of everything actually issued so far for this item,
  // never a separately-maintained counter that could drift.
  async getOriginalRemaining(workOrderId: string, itemCode: string, user: any): Promise<{ originalRequirement: number; totalIssued: number; originalRemaining: number }> {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, companyId: user.companyId },
      include: { bom: { include: { items: { where: { isActive: true, itemCode } } } } },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const bomItem = wo.bom?.items?.[0];
    const originalRequirement = bomItem ? (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty : 0;

    const issuedAgg = await this.prisma.productionIssueItem.aggregate({
      where: { itemCode, productionIssue: { workOrderId, status: 'ISSUED' } },
      _sum: { issuedQty: true },
    });
    const totalIssued = issuedAgg._sum.issuedQty || 0;

    return { originalRequirement, totalIssued, originalRemaining: Math.max(0, originalRequirement - totalIssued) };
  }

  // A request only makes sense once the requested qty genuinely exceeds
  // what's left of the original requirement - Store/Production should
  // never need this path for a plain remaining-quantity issue.
  async request(dto: RequestAdditionalMaterialDto, user: any) {
    const { originalRemaining } = await this.getOriginalRemaining(dto.workOrderId, dto.itemCode, user);
    if (dto.requestedQty <= originalRemaining + 0.0001) {
      throw new BadRequestException(`${dto.requestedQty} ${dto.itemCode} is still within the original approved requirement (${originalRemaining} remaining) - no additional approval needed, issue it normally.`);
    }

    const existing = await this.prisma.additionalMaterialRequest.findFirst({
      where: { companyId: user.companyId, workOrderId: dto.workOrderId, itemCode: dto.itemCode, status: 'PENDING', isActive: true },
    });
    if (existing) throw new BadRequestException(`An additional material request is already pending for ${dto.itemCode} on this work order`);

    const request = await this.prisma.additionalMaterialRequest.create({
      data: {
        companyId: user.companyId, workOrderId: dto.workOrderId,
        itemCode: dto.itemCode, itemName: dto.itemName, requestedQty: dto.requestedQty,
        reasonCategory: dto.reasonCategory, reason: dto.reason,
        approvalRequestId: 'pending',
        requestedById: user.id,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    const { request: approvalRequest } = await this.workflows.submit({
      documentType: 'ADDITIONAL_MATERIAL_REQUEST',
      documentId: request.id,
      documentNumber: `AMR-${request.id.slice(0, 8)}`,
      remarks: dto.reason,
    } as any, user);

    const updated = await this.prisma.additionalMaterialRequest.update({
      where: { id: request.id },
      data: { approvalRequestId: approvalRequest.id, updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'additional_material_requests', recordId: request.id, action: 'CREATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-013 sections 19-20: approvedQty may be less than
  // requestedQty (partial approval) - never more.
  async decide(id: string, dto: DecideAdditionalMaterialDto, user: any) {
    const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!request) throw new NotFoundException('Additional material request not found');
    if (request.status !== 'PENDING') throw new BadRequestException(`Request is already ${request.status}`);

    let approvedQty: number | null = null;
    if (dto.action === 'APPROVED') {
      approvedQty = dto.approvedQty ?? request.requestedQty;
      if (approvedQty <= 0) throw new BadRequestException('Approved quantity must be greater than 0');
      if (approvedQty > request.requestedQty) {
        throw new BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${request.requestedQty})`);
      }
    }

    await this.workflows.act(request.approvalRequestId, { action: dto.action, comments: dto.comments } as any, user);

    const updated = await this.prisma.additionalMaterialRequest.update({
      where: { id },
      data: {
        status: dto.action, approvedById: user.id, approvedAt: new Date(),
        approvedQty: approvedQty ?? undefined,
        approverComments: dto.comments, updatedBy: user.id,
      },
    });

    await this.audit.log({ tableName: 'additional_material_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // STORE-013 section 33: an unused approval can be revoked; the
  // already-issued portion (usedQty) is never undone by this.
  async revoke(id: string, user: any) {
    const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!request) throw new NotFoundException('Additional material request not found');
    if (request.status !== 'APPROVED') throw new BadRequestException('Only an APPROVED request can be revoked');

    const updated = await this.prisma.additionalMaterialRequest.update({
      where: { id },
      data: { status: 'REVOKED', updatedBy: user.id },
    });
    await this.audit.log({ tableName: 'additional_material_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
    return updated;
  }

  // Used by ProductionIssueService.create() to find a usable approval
  // for the portion of an issue that exceeds the original requirement.
  // Must be APPROVED with remaining unused capacity (approvedQty -
  // usedQty) - an approval may cover more than one issue as long as
  // capacity remains, never fully "spent" until fully used.
  async findActiveApprovedRequest(workOrderId: string, itemCode: string, user: any) {
    const candidates = await this.prisma.additionalMaterialRequest.findMany({
      where: { companyId: user.companyId, workOrderId, itemCode, status: 'APPROVED', isActive: true },
      orderBy: { approvedAt: 'asc' },
    });
    return candidates.find(r => (r.approvedQty || 0) - r.usedQty > 0.0001) || null;
  }

  // Atomically claims up to wantQty from an approved request's
  // remaining capacity. Retries with a fresh read if a concurrent
  // issue changed usedQty in between, same pattern as
  // MaterialIssueOverride.consume(). Returns however much was
  // actually claimed.
  async consume(requestId: string, issueId: string, wantQty: number, user: any): Promise<number> {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id: requestId } });
      if (!request || request.status !== 'APPROVED') return 0;
      const remaining = Math.max(0, (request.approvedQty || 0) - request.usedQty);
      const claimQty = Math.min(remaining, wantQty);
      if (claimQty <= 0.0001) return 0;

      const newUsedQty = request.usedQty + claimQty;

      const claim = await this.prisma.additionalMaterialRequest.updateMany({
        where: { id: requestId, usedQty: request.usedQty },
        data: { usedQty: newUsedQty, updatedBy: user.id },
      });
      if (claim.count === 1) return claimQty;
    }
    throw new BadRequestException('Could not consume additional material approval capacity - too many concurrent updates, please retry.');
  }

  async findPending(user: any) {
    return this.prisma.additionalMaterialRequest.findMany({
      where: { companyId: user.companyId, status: 'PENDING', isActive: true },
      include: {
        workOrder: { select: { woNumber: true, productName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async findForWorkOrder(workOrderId: string, user: any) {
    return this.prisma.additionalMaterialRequest.findMany({
      where: { companyId: user.companyId, workOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const request = await this.prisma.additionalMaterialRequest.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        workOrder: { select: { woNumber: true, productName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!request) throw new NotFoundException('Additional material request not found');
    return request;
  }
}
