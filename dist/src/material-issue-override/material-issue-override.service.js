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
        const item = status.items.find(i => i.itemCode === dto.itemCode);
        if (!item || item.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Previous material status for ${dto.itemCode} is already CLEAR on this work order - no override needed`);
        }
        const existing = await this.prisma.materialIssueOverride.findFirst({
            where: { companyId: user.companyId, workOrderId: dto.workOrderId, itemCode: dto.itemCode, status: 'PENDING', isActive: true },
        });
        if (existing)
            throw new common_1.BadRequestException(`An override request is already pending for ${dto.itemCode} on this work order`);
        const deadlineAt = new Date(Date.now() + DEADLINE_HOURS * 60 * 60 * 1000);
        const override = await this.prisma.materialIssueOverride.create({
            data: {
                companyId: user.companyId, workOrderId: dto.workOrderId,
                itemCode: dto.itemCode, itemName: dto.itemName, requestedQty: dto.requestedQty,
                approvalRequestId: 'pending',
                itemsSnapshot: [item],
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
        var _a;
        const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId, companyId: user.companyId } });
        if (!override)
            throw new common_1.NotFoundException('Override request not found');
        if (override.status !== 'PENDING')
            throw new common_1.BadRequestException(`Override request is already ${override.status}`);
        if (new Date() > override.deadlineAt) {
            await this.prisma.materialIssueOverride.update({ where: { id: overrideId }, data: { status: 'EXPIRED', updatedBy: user.id } });
            throw new common_1.BadRequestException('This override request has expired (past its 5-hour decision window) - a new request is needed');
        }
        let approvedQty = null;
        if (dto.action === 'APPROVED') {
            approvedQty = (_a = dto.approvedQty) !== null && _a !== void 0 ? _a : override.requestedQty;
            if (approvedQty <= 0)
                throw new common_1.BadRequestException('Approved quantity must be greater than 0');
            if (approvedQty > override.requestedQty) {
                throw new common_1.BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${override.requestedQty})`);
            }
        }
        await this.workflows.act(override.approvalRequestId, { action: dto.action, comments: dto.comments }, user);
        const updated = await this.prisma.materialIssueOverride.update({
            where: { id: overrideId },
            data: {
                status: dto.action, approvedById: user.id, approvedAt: new Date(),
                approvedQty: approvedQty !== null && approvedQty !== void 0 ? approvedQty : undefined,
                approverComments: dto.comments, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'material_issue_overrides', recordId: overrideId, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findActiveApprovedOverride(workOrderId, itemCode, user) {
        const candidates = await this.prisma.materialIssueOverride.findMany({
            where: {
                companyId: user.companyId, workOrderId, itemCode, status: 'APPROVED',
                isActive: true, deadlineAt: { gt: new Date() },
            },
            orderBy: { approvedAt: 'asc' },
        });
        return candidates.find(o => (o.approvedQty || 0) - o.usedQty > 0.0001) || null;
    }
    async consume(overrideId, issueId, wantQty, user) {
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const override = await this.prisma.materialIssueOverride.findFirst({ where: { id: overrideId } });
            if (!override || override.status !== 'APPROVED')
                return 0;
            const remaining = Math.max(0, (override.approvedQty || 0) - override.usedQty);
            const claimQty = Math.min(remaining, wantQty);
            if (claimQty <= 0.0001)
                return 0;
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
            if (claim.count === 1)
                return claimQty;
        }
        throw new common_1.BadRequestException('Could not consume override capacity - too many concurrent updates, please retry.');
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