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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialIssueOverrideService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const workflows_service_1 = require("../workflows/workflows.service");
const production_material_return_service_1 = require("../production-material-return/production-material-return.service");
const DEADLINE_HOURS = 5;
let MaterialIssueOverrideService = class MaterialIssueOverrideService {
    constructor(prisma, audit, workflows, materialReturnService) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
        this.materialReturnService = materialReturnService;
    }
    async request(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const status = await this.materialReturnService.getPreviousMaterialStatus(dto.workOrderId, user);
        if (status.overallStatus !== 'PENDING') {
            throw new common_1.BadRequestException('Previous material status is already CLEAR for this work order - no override needed');
        }
        const pendingItems = status.items.filter(i => i.status === 'PENDING');
        const existing = await this.prisma.materialIssueOverride.findFirst({
            where: { companyId: user.companyId, workOrderId: dto.workOrderId, status: 'PENDING', isActive: true },
        });
        if (existing)
            throw new common_1.BadRequestException('An override request is already pending for this work order');
        const deadlineAt = new Date(Date.now() + DEADLINE_HOURS * 60 * 60 * 1000);
        const override = await this.prisma.materialIssueOverride.create({
            data: {
                companyId: user.companyId, workOrderId: dto.workOrderId,
                approvalRequestId: 'pending',
                itemsSnapshot: pendingItems,
                reason: dto.reason, requestedById: user.id, deadlineAt,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        const { request: approvalRequest } = await this.workflows.submit({
            documentType: 'MATERIAL_ISSUE_OVERRIDE',
            documentId: override.id,
            documentNumber: `MIO-${override.id.slice(0, 8)}`,
            remarks: dto.reason,
        }, user);
        const updated = await this.prisma.materialIssueOverride.update({
            where: { id: override.id },
            data: { approvalRequestId: approvalRequest.id, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'material_issue_overrides', recordId: override.id, action: 'CREATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async decide(overrideId, dto, user) {
        const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId, companyId: user.companyId } });
        if (!override)
            throw new common_1.NotFoundException('Override request not found');
        if (override.status !== 'PENDING')
            throw new common_1.BadRequestException(`Override request is already ${override.status}`);
        if (new Date() > override.deadlineAt) {
            await this.prisma.materialIssueOverride.update({ where: { id: overrideId }, data: { status: 'EXPIRED', updatedBy: user.id } });
            throw new common_1.BadRequestException('This override request has expired (past its 5-hour decision window) - a new request is needed');
        }
        await this.workflows.act(override.approvalRequestId, { action: dto.action, comments: dto.comments }, user);
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
    async findActiveApprovedOverride(workOrderId, user) {
        return this.prisma.materialIssueOverride.findFirst({
            where: {
                companyId: user.companyId, workOrderId, status: 'APPROVED',
                isActive: true, deadlineAt: { gt: new Date() },
            },
            orderBy: { approvedAt: 'desc' },
        });
    }
    async consume(overrideId, issueId, user) {
        return this.prisma.materialIssueOverride.update({
            where: { id: overrideId },
            data: { status: 'CONSUMED', consumedByIssueId: issueId, updatedBy: user.id },
        });
    }
    async findPending(user) {
        return this.prisma.materialIssueOverride.findMany({
            where: { companyId: user.companyId, status: 'PENDING', isActive: true },
            include: {
                workOrder: { select: { woNumber: true, productName: true } },
                requestedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { requestedAt: 'asc' },
        });
    }
    async findOne(id, user) {
        const override = await this.prisma.materialIssueOverride.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                workOrder: { select: { woNumber: true, productName: true } },
                requestedBy: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
            },
        });
        if (!override)
            throw new common_1.NotFoundException('Override request not found');
        return override;
    }
};
exports.MaterialIssueOverrideService = MaterialIssueOverrideService;
exports.MaterialIssueOverrideService = MaterialIssueOverrideService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService,
        production_material_return_service_1.ProductionMaterialReturnService])
], MaterialIssueOverrideService);
//# sourceMappingURL=material-issue-override.service.js.map