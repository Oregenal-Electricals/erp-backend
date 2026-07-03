import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';

const DEFAULT_WORKFLOWS = [
  { name:'Purchase Order Approval', documentType:'PURCHASE_ORDER', triggerCondition:'ALWAYS', levels:1, description:'All POs require manager approval', steps:[{ level:1, stepName:'Manager Approval', timeoutHours:48 }] },
  { name:'Sales Order Approval', documentType:'SALES_ORDER', triggerCondition:'ABOVE_AMOUNT', triggerAmount:500000, levels:1, description:'SOs above ₹5 lakh require approval', steps:[{ level:1, stepName:'Sales Head Approval', timeoutHours:24 }] },
  { name:'AP Bill Approval', documentType:'AP_BILL', triggerCondition:'ABOVE_AMOUNT', triggerAmount:100000, levels:2, description:'Bills above ₹1 lakh require 2-level approval', steps:[{ level:1, stepName:'Finance Manager', timeoutHours:24 },{ level:2, stepName:'CFO Approval', timeoutHours:48 }] },
  { name:'Credit Override Approval', documentType:'CREDIT_OVERRIDE', triggerCondition:'ALWAYS', levels:1, description:'All credit limit overrides require approval', steps:[{ level:1, stepName:'Credit Controller', timeoutHours:4 }] },
  { name:'Journal Voucher Approval', documentType:'VOUCHER', triggerCondition:'ABOVE_AMOUNT', triggerAmount:50000, levels:1, description:'Vouchers above ₹50k require CFO approval', steps:[{ level:1, stepName:'CFO Approval', timeoutHours:48 }] },
];

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async seedDefaults(companyId: string, userId: string) {
    const existing = await this.prisma.workflowDefinition.count({ where: { companyId } });
    if (existing > 0) return { message: 'Workflows already seeded', count: existing };

    for (const wf of DEFAULT_WORKFLOWS) {
      const created = await this.prisma.workflowDefinition.create({
        data: {
          name: wf.name, documentType: wf.documentType,
          triggerCondition: wf.triggerCondition, triggerAmount: wf.triggerAmount,
          levels: wf.levels, description: wf.description,
          companyId, createdBy: userId, updatedBy: userId,
          steps: { create: wf.steps.map(s => ({ ...s, companyId, createdBy: userId, updatedBy: userId })) },
        },
      });
    }
    return { message: 'Default workflows seeded', count: DEFAULT_WORKFLOWS.length };
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

  async submit(dto: SubmitForApprovalDto, user: any) {
    // Find applicable workflow
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { companyId: user.companyId, documentType: dto.documentType, isActive: true },
      include: { steps: { orderBy: { level: 'asc' } } },
    });

    // Check if approval is needed
    if (workflow) {
      if (workflow.triggerCondition === 'ABOVE_AMOUNT' && dto.amount && dto.amount <= (workflow.triggerAmount || 0)) {
        return { requiresApproval: false, message: 'Amount below threshold — auto-approved', autoApproved: true };
      }
    }

    // Check if already pending
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

  async act(requestId: string, dto: ApproveRejectDto, user: any) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } } },
    });
    if (!request) throw new NotFoundException('Approval request not found');
    if (request.status !== 'PENDING') throw new BadRequestException(`Request is already ${request.status}`);

    // Record action
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
        newLevel = request.currentLevel + 1; // advance to next level
      }
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: newStatus, currentLevel: newLevel, updatedBy: user.id },
      include: { actions: true, workflow: { select: { name: true } } },
    });

    await this.audit.log({ tableName: 'approval_requests', recordId: requestId, action: 'UPDATE', newValues: updated, changedBy: user.id });
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
    const { page = 1, limit = 20, status, documentType, myPending } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId };
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
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

  async findOneRequest(id: string, user: any) {
    const req = await this.prisma.approvalRequest.findFirst({
      where: { id, companyId: user.companyId },
      include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } }, actions: { orderBy: { level: 'asc' } } },
    });
    if (!req) throw new NotFoundException('Request not found');
    return req;
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
