"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const bom_service_1 = require("../bom/bom.service");
const product_service_1 = require("../products/product.service");
const DEFAULT_WORKFLOWS = [
    { name: 'Purchase Order Approval', documentType: 'PURCHASE_ORDER', triggerCondition: 'ALWAYS', levels: 1, description: 'All POs require manager approval', steps: [{ level: 1, stepName: 'Manager Approval', timeoutHours: 48 }] },
    { name: 'Sales Order Approval', documentType: 'SALES_ORDER', triggerCondition: 'ABOVE_AMOUNT', triggerAmount: 500000, levels: 1, description: 'SOs above ₹5 lakh require approval', steps: [{ level: 1, stepName: 'Sales Head Approval', timeoutHours: 24 }] },
    { name: 'AP Bill Approval', documentType: 'AP_BILL', triggerCondition: 'ABOVE_AMOUNT', triggerAmount: 100000, levels: 2, description: 'Bills above ₹1 lakh require 2-level approval', steps: [{ level: 1, stepName: 'Finance Manager', timeoutHours: 24 }, { level: 2, stepName: 'CFO Approval', timeoutHours: 48 }] },
    { name: 'Credit Override Approval', documentType: 'CREDIT_OVERRIDE', triggerCondition: 'ALWAYS', levels: 1, description: 'All credit limit overrides require approval', steps: [{ level: 1, stepName: 'Credit Controller', timeoutHours: 4 }] },
    { name: 'Journal Voucher Approval', documentType: 'VOUCHER', triggerCondition: 'ABOVE_AMOUNT', triggerAmount: 50000, levels: 1, description: 'Vouchers above ₹50k require CFO approval', steps: [{ level: 1, stepName: 'CFO Approval', timeoutHours: 48 }] },
    { name: 'BOM Approval', documentType: 'BOM', triggerCondition: 'ALWAYS', levels: 4, description: 'New/revised BOMs require 4-level sequential approval before they become usable', steps: [
            { level: 1, stepName: 'Level 1 Review', timeoutHours: 48 },
            { level: 2, stepName: 'Level 2 Review', timeoutHours: 48 },
            { level: 3, stepName: 'Level 3 Review', timeoutHours: 48 },
            { level: 4, stepName: 'Final Approval', timeoutHours: 48 },
        ] },
    { name: 'Product Approval', documentType: 'PRODUCT', triggerCondition: 'ALWAYS', levels: 4, description: 'New products require 4-level sequential approval before they become usable', steps: [
            { level: 1, stepName: 'Level 1 Review', timeoutHours: 48 },
            { level: 2, stepName: 'Level 2 Review', timeoutHours: 48 },
            { level: 3, stepName: 'Level 3 Review', timeoutHours: 48 },
            { level: 4, stepName: 'Final Approval', timeoutHours: 48 },
        ] },
];
let WorkflowsService = class WorkflowsService {
    constructor(prisma, audit, bomService, productService) {
        this.prisma = prisma;
        this.audit = audit;
        this.bomService = bomService;
        this.productService = productService;
    }
    async seedDefaults(companyId, userId) {
        const existingTypes = new Set((await this.prisma.workflowDefinition.findMany({ where: { companyId }, select: { documentType: true } }))
            .map(w => w.documentType));
        let createdCount = 0;
        for (const wf of DEFAULT_WORKFLOWS) {
            if (existingTypes.has(wf.documentType))
                continue;
            await this.prisma.workflowDefinition.create({
                data: {
                    name: wf.name, documentType: wf.documentType,
                    triggerCondition: wf.triggerCondition, triggerAmount: wf.triggerAmount,
                    levels: wf.levels, description: wf.description,
                    companyId, createdBy: userId, updatedBy: userId,
                    steps: { create: wf.steps.map(s => (Object.assign(Object.assign({}, s), { companyId, createdBy: userId, updatedBy: userId }))) },
                },
            });
            createdCount++;
        }
        if (createdCount === 0)
            return { message: 'Workflows already seeded', count: existingTypes.size };
        return { message: 'Missing default workflows seeded', count: createdCount };
    }
    async create(dto, user) {
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
    async update(id, dto, user) {
        const existing = await this.prisma.workflowDefinition.findFirst({ where: { id, companyId: user.companyId } });
        if (!existing)
            throw new common_1.NotFoundException('Workflow definition not found');
        const data = { updatedBy: user.id };
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.triggerCondition !== undefined)
            data.triggerCondition = dto.triggerCondition;
        if (dto.triggerAmount !== undefined)
            data.triggerAmount = dto.triggerAmount;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.steps)
            data.levels = dto.steps.length;
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
    async submit(dto, user) {
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
        if (existing)
            throw new common_1.BadRequestException('Approval request already pending for this document');
        const request = await this.prisma.approvalRequest.create({
            data: {
                workflowId: workflow === null || workflow === void 0 ? void 0 : workflow.id, documentType: dto.documentType,
                documentId: dto.documentId, documentNumber: dto.documentNumber,
                requestedBy: user.id, currentLevel: 1,
                totalLevels: (workflow === null || workflow === void 0 ? void 0 : workflow.levels) || 1,
                amount: dto.amount, remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: { workflow: { select: { name: true, steps: true } }, actions: true },
        });
        await this.audit.log({ tableName: 'approval_requests', recordId: request.id, action: 'CREATE', newValues: request, changedBy: user.id });
        return { requiresApproval: true, request };
    }
    async act(requestId, dto, user) {
        var _a;
        const request = await this.prisma.approvalRequest.findFirst({
            where: { id: requestId, companyId: user.companyId },
            include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } } },
        });
        if (!request)
            throw new common_1.NotFoundException('Approval request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException(`Request is already ${request.status}`);
        const currentStep = (_a = request.workflow) === null || _a === void 0 ? void 0 : _a.steps.find(s => s.level === request.currentLevel);
        if ((currentStep === null || currentStep === void 0 ? void 0 : currentStep.approverUserId) && currentStep.approverUserId !== user.id && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException(`Only the assigned approver for "${currentStep.stepName}" (level ${request.currentLevel}) can act on this request`);
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
        }
        else if (dto.action === 'APPROVED') {
            if (request.currentLevel >= request.totalLevels) {
                newStatus = 'APPROVED';
            }
            else {
                newLevel = request.currentLevel + 1;
            }
        }
        const updated = await this.prisma.approvalRequest.update({
            where: { id: requestId },
            data: { status: newStatus, currentLevel: newLevel, updatedBy: user.id },
            include: { actions: true, workflow: { select: { name: true } } },
        });
        await this.audit.log({ tableName: 'approval_requests', recordId: requestId, action: 'UPDATE', newValues: updated, changedBy: user.id });
        if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
            if (request.documentType === 'BOM') {
                if (newStatus === 'APPROVED')
                    await this.bomService.onWorkflowApproved(request.documentId, user);
                else
                    await this.bomService.onWorkflowRejected(request.documentId, user);
            }
            else if (request.documentType === 'PRODUCT') {
                if (newStatus === 'APPROVED')
                    await this.productService.onWorkflowApproved(request.documentId, user);
                else
                    await this.productService.onWorkflowRejected(request.documentId, user);
            }
        }
        return updated;
    }
    async cancel(requestId, user) {
        const request = await this.prisma.approvalRequest.findFirst({ where: { id: requestId, companyId: user.companyId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Can only cancel PENDING requests');
        const updated = await this.prisma.approvalRequest.update({
            where: { id: requestId }, data: { status: 'CANCELLED', updatedBy: user.id },
        });
        return updated;
    }
    async findAllWorkflows(user) {
        return this.prisma.workflowDefinition.findMany({
            where: { companyId: user.companyId },
            include: { steps: { orderBy: { level: 'asc' } }, _count: { select: { requests: true } } },
            orderBy: { documentType: 'asc' },
        });
    }
    async findAllRequests(user, query) {
        const { page = 1, limit = 20, status, documentType, documentId, myPending } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        if (documentType)
            where.documentType = documentType;
        if (documentId)
            where.documentId = documentId;
        if (myPending === 'true') {
            where.status = 'PENDING';
            where.requestedBy = user.id;
        }
        const [data, total] = await Promise.all([
            this.prisma.approvalRequest.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { workflow: { select: { name: true } }, actions: { orderBy: { createdAt: 'desc' }, take: 1 } },
            }),
            this.prisma.approvalRequest.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOneRequest(id, user) {
        const req = await this.prisma.approvalRequest.findFirst({
            where: { id, companyId: user.companyId },
            include: { workflow: { include: { steps: { orderBy: { level: 'asc' } } } }, actions: { orderBy: { level: 'asc' } } },
        });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        return this.attachActorNames(req, user);
    }
    async attachActorNames(req, user) {
        var _a;
        const userIds = new Set();
        userIds.add(req.requestedBy);
        for (const step of ((_a = req.workflow) === null || _a === void 0 ? void 0 : _a.steps) || [])
            if (step.approverUserId)
                userIds.add(step.approverUserId);
        for (const action of req.actions || [])
            userIds.add(action.actionBy);
        const users = userIds.size > 0
            ? await this.prisma.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, firstName: true, lastName: true, email: true } })
            : [];
        const names = {};
        for (const u of users)
            names[u.id] = { firstName: u.firstName, lastName: u.lastName, email: u.email };
        return Object.assign(Object.assign({}, req), { actorNames: names });
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, pending, approved, rejected, cancelled, workflows] = await Promise.all([
            this.prisma.approvalRequest.count({ where }),
            this.prisma.approvalRequest.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            this.prisma.approvalRequest.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.approvalRequest.count({ where: Object.assign(Object.assign({}, where), { status: 'REJECTED' }) }),
            this.prisma.approvalRequest.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
            this.prisma.workflowDefinition.count({ where: { companyId: user.companyId, isActive: true } }),
        ]);
        return { total, pending, approved, rejected, cancelled, activeWorkflows: workflows };
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => bom_service_1.BomService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => product_service_1.ProductService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        bom_service_1.BomService,
        product_service_1.ProductService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map