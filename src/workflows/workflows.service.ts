import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateWorkflowDto, UpdateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
import { BomService } from '../bom/bom.service';
import { ProductService } from '../products/product.service';

const DEFAULT_WORKFLOWS = [
  { name:'Purchase Order Approval', documentType:'PURCHASE_ORDER', triggerCondition:'ALWAYS', levels:1, description:'All POs require manager approval', steps:[{ level:1, stepName:'Manager Approval', timeoutHours:48 }] },
  { name:'Sales Order Approval', documentType:'SALES_ORDER', triggerCondition:'ABOVE_AMOUNT', triggerAmount:500000, levels:1, description:'SOs above ₹5 lakh require approval', steps:[{ level:1, stepName:'Sales Head Approval', timeoutHours:24 }] },
  { name:'AP Bill Approval', documentType:'AP_BILL', triggerCondition:'ABOVE_AMOUNT', triggerAmount:100000, levels:2,description:'Bills above ₹1 lakh require 2-level approval', steps:[{ level:1, stepName:'Finance Manager', timeoutHours:24 },{ level:2, stepName:'CFO Approval', timeoutHours:48 }] },
  { name:'Credit Override Approval', documentType:'CREDIT_OVERRIDE', triggerCondition:'ALWAYS', levels:1, description:'All credit limit overrides require approval', steps:[{ level:1, stepName:'Credit Controller', timeoutHours:4 }] },
  { name:'Journal Voucher Approval', documentType:'VOUCHER', triggerCondition:'ABOVE_AMOUNT', triggerAmount:50000, levels:1, description:'Vouchers above ₹50k require CFO approval', steps:[{ level:1, stepName:'CFO Approval', timeoutHours:48 }] },
  { name:'BOM Approval', documentType:'BOM', triggerCondition:'ALWAYS', levels:4, description:'New/revised BOMs require 4-level sequential approval before they become usable', steps:[
    { level:1, stepName:'Level 1 Review', timeoutHours:48 },
    { level:2, stepName:'Level 2 Review', timeoutHours:48 },
    { level:3, stepName:'Level 3 Review', timeoutHours:48 },
    { level:4, stepName:'Final Approval', timeoutHours:48 },
  ] },
  { name:'Product Approval', documentType:'PRODUCT', triggerCondition:'ALWAYS', levels:4, description:'New products require 4-level sequential approval before they become usable', steps:[
    { level:1, stepName:'Level 1 Review', timeoutHours:48 },
    { level:2, stepName:'Level 2 Review', timeoutHours:48 },
    { level:3, stepName:'Level 3 Review', timeoutHours:48 },
    { level:4, stepName:'Final Approval', timeoutHours:48 },
  ] },
];

@Injectable()
export class WorkflowsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    @Inject(forwardRef(() => BomService)) private bomService: BomService,
    @Inject(forwardRef(() => ProductService)) private productService: ProductService,
  ) {}

  async seedDefaults(companyId: string, userId: string) {
    const existingTypes = new Set(
      (await this.prisma.workflowDefinition.findMany({ where: { companyId }, select: { documentType: true } }))
        .map(w => w.documentType),
    );
    let createdCount = 0;
    for (const wf of DEFAULT_WORKFLOWS) {
      if (existingTypes.has(wf.documentType)) continue;
      await this.prisma.workflowDefinition.create({
        data: {
          name: wf.name, documentType: wf.documentType,
          triggerCondition: wf.triggerCondition, triggerAmount: wf.triggerAmount,
          levels: wf.levels, description: wf.description,
          companyId, createdBy: userId, updatedBy: userId,
          steps: { create: wf.steps.map(s => ({ ...s, companyId, createdBy: userId, updatedBy: userId })) },
        },
      });
      createdCount++;
    }
    if (createdCount === 0) return { message: 'Workflows already seeded', count: existingTypes.size };
    return { message: 'Missing default workflows seeded', count: createdCount };
  }

  async create(dto: CreateWorkflowDto, user: any) {
    const wf = await this.prisma.workflowDefinition.create({
      data: {
        name: dto.name, documentType: dto.documentType,
        triggerCondition: dto.triggerCondition || 'ALWAYS',
        triggerAmount: dto.triggerAmount, levels: dto.steps.length,
        description: dto.description,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        steps: { create: dto.steps.map(s => ({ level: s.level, stepName: s.stepName, approverUserId: s.approverUserId, timeoutHours: s.timeoutHours || 48, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) },
      },
      include: { steps: true },
    });
    await this.audit.log({ tableName: 'workflow_definitions', recordId: wf.id, action: 'CREATE', newValues: wf, changedBy: user.id });
    return wf;
  }

  // Admin reconfigures an existing workflow definition - name/trigger/description,
  // and/or replaces its ordered step list wholesale (add/remove/reorder steps,
  // reassign which specific person approves each level). A document type can
  // only have one active definition (see the unique constraint on
  // [companyId, documentType]), so this is how Admin changes level count or
  // approvers after the fact, rather than creating a competing duplicate.
  async update(id: string, dto: UpdateWorkflowDto, user: any) {
    const existing = await this.prisma.workflowDefinition.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) throw new NotFoundException('Workflow definition not found');

    const data: any = { updatedBy: user.id };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.triggerCondition !== undefined) data.triggerCondition = dto.triggerCondition;
    if (dto.triggerAmount !== undefined) data.triggerAmount = dto.triggerAmount;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.steps) data.levels = dto.steps.length;

    if (dto.steps) {
      await this.prisma.workflowStep.deleteMany({ where: { workflowId: id } });
      data.steps = { create: dto.steps.map(s => ({ level: s.level, stepName: s.stepName, approverUserId: s.approverUserId, timeoutHours: s.timeoutHours || 48, companyId: user.companyId, createdBy: user.id, updatedBy: user.id })) };
    }

    const updated = await this.prisma.workflowDefinition.update({
      where: { id }, data, include: { steps: { orderBy: { level: 'asc' } } },
    });
    await this.audit.log({ tableName: 'workflow_definitions', recordId: id, action: 'UPDATE', oldValues: existing, newValues: updated, changedBy: user.id });
    return updated;
  }

  async submit(dto: SubmitForApprovalDto, user: any) {
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { companyId: user.companyId, documentType: dto.documentType, isActive: true },
      include: { steps: { orderBy: { level: 'asc' } } },
    });

    if (workflow) {
      if (workflow.triggerCondition === 'ABOVE_AMOUNT' && dto.amount && dto.amount <= (workflow.triggerAmount || 0)) {
        return { requiresApproval: false, message: 'Amount below threshold - auto-approved', autoApproved: true };
      }
    }

    const existing = await this.prisma.approvalRequest.findFirst({
      where: { companyId: user.companyId, documentId: dto.documentId, status: 'PENDING' },
    });
    if (existing) throw new BadRequestException('Approval request already pending for this document');

    const request = await this.prisma.approvalRequest.create({
      data: {
        workflowId: workflow?.id, documentType: dto.documentType,
        documentId: dto.documentId, documentNumber: dto.documentNumber,
        requestedBy: user.id, currentLevel: 1,
        totalLevels: workflow?.levels || 1,
        amount: dto.amount, remarks: dto.remarks,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
      include: { workflow: { select: { name: true, steps: true } }, actions: true },
    });

    await this.audit.log({ tableName: 'approval_requests', recordId: request.id, action: 'CREATE', newValues: request, changedBy: user.id });
    return { requiresApproval: true, request };
  }

  // Called when a document under review is edited (currently: a BOM,
  // by its creator, while an open query flagged something to fix). The
  // in-progress chain is cancelled - not deleted, so its history stays
  // visible - and a brand new request starts fresh at level 1, so every
  // approver reviews the corrected content rather than resuming from
  // wherever the old, now-outdated chain had gotten to.
  async restartForEdit(documentType: string, documentId: string, documentNumber: string, user: any) {
    const existing = await this.prisma.approvalRequest.findFirst({
      where: { companyId: user.companyId, documentType, documentId, status: 'PENDING' },
    });
    if (existing) {
      await this.prisma.approvalRequest.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED', updatedBy: user.id },
      });
      await this.audit.log({
        tableName: 'approval_requests', recordId: existing.id, action: 'UPDATE',
        newValues: { status: 'CANCELLED', reason: 'Document edited after a query - chain restarted' },
        changedBy: user.id,
      });
    }
    return this.submit({ documentType, documentId, documentNumber }, user);
  }

  async act(requestId: string, dto: ApproveRejectDto, user: any) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } } },
    });
    if (!request) throw new NotFoundException('Approval request not found');
    if (request.status !== 'PENDING') throw new BadRequestException(`Request is already ${request.status}`);

    // Per-step approver enforcement: when the current level has a specific
    // person assigned, only that person (or SUPER_ADMIN) may act at this
    // level - holding the generic WORKFLOW_ACT permission is not by itself
    // enough. A level left unassigned (no approverUserId configured yet)
    // stays open to anyone with WORKFLOW_ACT, so a freshly-seeded workflow
    // is usable before Admin has assigned specific people to every step.
    const currentStep = request.workflow?.steps.find(s => s.level === request.currentLevel);
    if (currentStep?.approverUserId && currentStep.approverUserId !== user.id && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(`Only the assigned approver for "${currentStep.stepName}" (level ${request.currentLevel}) can act on this request`);
    }

    await this.prisma.approvalAction.create({
      data: {
        requestId, level: request.currentLevel,
        action: dto.action, actionBy: user.id,
        comments: dto.comments, actionDate: new Date(),
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });

    let newStatus = request.status;
    let newLevel = request.currentLevel;

    if (dto.action === 'REJECTED') {
      newStatus = 'REJECTED';
    } else if (dto.action === 'APPROVED') {
      if (request.currentLevel >= request.totalLevels) {
        newStatus = 'APPROVED';
      } else {
        newLevel = request.currentLevel + 1;
      }
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: newStatus, currentLevel: newLevel, updatedBy: user.id },
      include: { actions: true, workflow: { select: { name: true } } },
    });

    await this.audit.log({ tableName: 'approval_requests', recordId: requestId, action: 'UPDATE', newValues: updated, changedBy: user.id });

    // Terminal state reached - sync the originating document's own status.
    // The engine stays generic (any documentType can submit into it); this
    // is the one place that knows how to route a finished request back to
    // its source record.
    if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      if (request.documentType === 'BOM') {
        if (newStatus === 'APPROVED') await this.bomService.onWorkflowApproved(request.documentId, user);
        else await this.bomService.onWorkflowRejected(request.documentId, user);
      } else if (request.documentType === 'PRODUCT') {
        if (newStatus === 'APPROVED') await this.productService.onWorkflowApproved(request.documentId, user);
        else await this.productService.onWorkflowRejected(request.documentId, user);
      }
    }

    return updated;
  }

  async cancel(requestId: string, user: any) {
    const request = await this.prisma.approvalRequest.findFirst({ where: { id: requestId, companyId: user.companyId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Can only cancel PENDING requests');

    const updated = await this.prisma.approvalRequest.update({
      where: { id: requestId }, data: { status: 'CANCELLED', updatedBy: user.id },
    });
    return updated;
  }

  async findAllWorkflows(user: any) {
    return this.prisma.workflowDefinition.findMany({
      where: { companyId: user.companyId },
      include: { steps: { orderBy: { level: 'asc' } }, _count: { select: { requests: true } } },
      orderBy: { documentType: 'asc' },
    });
  }

  async findAllRequests(user: any, query: any) {
    const { page = 1, limit = 20, status, documentType, documentId, myPending } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
    if (documentId) where.documentId = documentId;
    if (myPending === 'true') { where.status = 'PENDING'; where.requestedBy = user.id; }

    const [data, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { workflow: { select: { name: true } }, actions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  // Enriched with actor names (requester, each step's assigned approver, each
  // action's actor) so the panel can show "Approved by Priya Sharma" rather
  // than a bare user id - this is the single source both the approvals panel
  // AND a document's own detail page (BOM/Product) read from to render the
  // complete approval timeline, from submission through to wherever it
  // currently stands.
  async findMyApprovals(user: any) {
    if (user.role === 'SUPER_ADMIN') {
      const all = await this.prisma.approvalRequest.findMany({
        where: { companyId: user.companyId, status: 'PENDING' },
        include: { workflow: { include: { steps: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return all.map(({ workflow, ...r }) => r);
    }
    const pending = await this.prisma.approvalRequest.findMany({
      where: { companyId: user.companyId, status: 'PENDING' },
      include: { workflow: { include: { steps: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return pending
      .filter((req) => {
        const step = req.workflow?.steps.find((s) => s.level === req.currentLevel);
        if (!step) return false;
        return !step.approverUserId || step.approverUserId === user.id;
      })
      .map(({ workflow, ...r }) => r);
  }

  async findOneRequest(id: string, user: any) {
    const req = await this.prisma.approvalRequest.findFirst({
      where: { id, companyId: user.companyId },
      include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } }, actions: { orderBy: { level: 'asc' } } },
    });
    if (!req) throw new NotFoundException('Request not found');
    return this.attachActorNames(req, user);
  }

  private async attachActorNames(req: any, user: any) {
    const userIds = new Set<string>();
    userIds.add(req.requestedBy);
    for (const step of req.workflow?.steps || []) if (step.approverUserId) userIds.add(step.approverUserId);
    for (const action of req.actions || []) userIds.add(action.actionBy);
    const users = userIds.size > 0
      ? await this.prisma.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, firstName: true, lastName: true, email: true, role: true } })
      : [];
    const names: Record<string, any> = {};
    for (const u of users) names[u.id] = { firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role };
    return { ...req, actorNames: names };
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId };
    const [total, pending, approved, rejected, cancelled, workflows] = await Promise.all([
      this.prisma.approvalRequest.count({ where }),
      this.prisma.approvalRequest.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.approvalRequest.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.approvalRequest.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.approvalRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.workflowDefinition.count({ where: { companyId: user.companyId, isActive: true } }),
    ]);
    return { total, pending, approved, rejected, cancelled, activeWorkflows: workflows };
  }
}
