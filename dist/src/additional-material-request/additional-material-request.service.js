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
exports.AdditionalMaterialRequestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const workflows_service_1 = require("../workflows/workflows.service");
const material_reservation_service_1 = require("../work-orders/material-reservation.service");
let AdditionalMaterialRequestService = class AdditionalMaterialRequestService {
    constructor(prisma, audit, workflows, materialReservation) {
        this.prisma = prisma;
        this.audit = audit;
        this.workflows = workflows;
        this.materialReservation = materialReservation;
    }
    async getOriginalRemaining(workOrderId, itemCode, user) {
        var _a, _b;
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId: user.companyId },
            include: { bom: { include: { items: { where: { isActive: true, itemCode } } } } },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const bomItem = (_b = (_a = wo.bom) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b[0];
        const originalRequirement = bomItem ? (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty : 0;
        const issuedAgg = await this.prisma.productionIssueItem.aggregate({
            where: { itemCode, productionIssue: { workOrderId, status: 'ISSUED' } },
            _sum: { issuedQty: true },
        });
        const totalIssued = issuedAgg._sum.issuedQty || 0;
        return { originalRequirement, totalIssued, originalRemaining: Math.max(0, originalRequirement - totalIssued) };
    }
    async request(dto, user) {
        const { originalRemaining } = await this.getOriginalRemaining(dto.workOrderId, dto.itemCode, user);
        if (dto.requestedQty <= originalRemaining + 0.0001) {
            throw new common_1.BadRequestException(`${dto.requestedQty} ${dto.itemCode} is still within the original approved requirement (${originalRemaining} remaining) - no additional approval needed, issue it normally.`);
        }
        const existing = await this.prisma.additionalMaterialRequest.findFirst({
            where: { companyId: user.companyId, workOrderId: dto.workOrderId, itemCode: dto.itemCode, status: 'PENDING', isActive: true },
        });
        if (existing)
            throw new common_1.BadRequestException(`An additional material request is already pending for ${dto.itemCode} on this work order`);
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
        }, user);
        const updated = await this.prisma.additionalMaterialRequest.update({
            where: { id: request.id },
            data: { approvalRequestId: approvalRequest.id, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'additional_material_requests', recordId: request.id, action: 'CREATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async decide(id, dto, user) {
        var _a;
        const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!request)
            throw new common_1.NotFoundException('Additional material request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException(`Request is already ${request.status}`);
        let approvedQty = null;
        if (dto.action === 'APPROVED') {
            approvedQty = (_a = dto.approvedQty) !== null && _a !== void 0 ? _a : request.requestedQty;
            if (approvedQty <= 0)
                throw new common_1.BadRequestException('Approved quantity must be greater than 0');
            if (approvedQty > request.requestedQty) {
                throw new common_1.BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${request.requestedQty})`);
            }
        }
        await this.workflows.act(request.approvalRequestId, { action: dto.action, comments: dto.comments }, user);
        const updated = await this.prisma.additionalMaterialRequest.update({
            where: { id },
            data: {
                status: dto.action, approvedById: user.id, approvedAt: new Date(),
                approvedQty: approvedQty !== null && approvedQty !== void 0 ? approvedQty : undefined,
                approverComments: dto.comments, updatedBy: user.id,
            },
        });
        if (dto.action === 'APPROVED' && approvedQty) {
            const wo = await this.prisma.workOrder.findFirst({ where: { id: updated.workOrderId } });
            if (wo) {
                await this.materialReservation.reserveAdditionalQty(updated.workOrderId, updated.itemCode, updated.itemName, wo.warehouseId, approvedQty, updated.companyId, user.id);
            }
        }
        await this.audit.log({ tableName: 'additional_material_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async revoke(id, user) {
        const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!request)
            throw new common_1.NotFoundException('Additional material request not found');
        if (request.status !== 'APPROVED')
            throw new common_1.BadRequestException('Only an APPROVED request can be revoked');
        const updated = await this.prisma.additionalMaterialRequest.update({
            where: { id },
            data: { status: 'REVOKED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'additional_material_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findActiveApprovedRequest(workOrderId, itemCode, user) {
        const candidates = await this.prisma.additionalMaterialRequest.findMany({
            where: { companyId: user.companyId, workOrderId, itemCode, status: 'APPROVED', isActive: true },
            orderBy: { approvedAt: 'asc' },
        });
        return candidates.find(r => (r.approvedQty || 0) - r.usedQty > 0.0001) || null;
    }
    async consume(requestId, issueId, wantQty, user) {
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const request = await this.prisma.additionalMaterialRequest.findFirst({ where: { id: requestId } });
            if (!request || request.status !== 'APPROVED')
                return 0;
            const remaining = Math.max(0, (request.approvedQty || 0) - request.usedQty);
            const claimQty = Math.min(remaining, wantQty);
            if (claimQty <= 0.0001)
                return 0;
            const newUsedQty = request.usedQty + claimQty;
            const claim = await this.prisma.additionalMaterialRequest.updateMany({
                where: { id: requestId, usedQty: request.usedQty },
                data: { usedQty: newUsedQty, updatedBy: user.id },
            });
            if (claim.count === 1)
                return claimQty;
        }
        throw new common_1.BadRequestException('Could not consume additional material approval capacity - too many concurrent updates, please retry.');
    }
    async findPending(user) {
        return this.prisma.additionalMaterialRequest.findMany({
            where: { companyId: user.companyId, status: 'PENDING', isActive: true },
            include: {
                workOrder: { select: { woNumber: true, productName: true } },
                requestedBy: { select: { firstName: true, lastName: true } },
            },
            orderBy: { requestedAt: 'asc' },
        });
    }
    async findForWorkOrder(workOrderId, user) {
        return this.prisma.additionalMaterialRequest.findMany({
            where: { companyId: user.companyId, workOrderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, user) {
        const request = await this.prisma.additionalMaterialRequest.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                workOrder: { select: { woNumber: true, productName: true } },
                requestedBy: { select: { firstName: true, lastName: true } },
                approvedBy: { select: { firstName: true, lastName: true } },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Additional material request not found');
        return request;
    }
};
exports.AdditionalMaterialRequestService = AdditionalMaterialRequestService;
exports.AdditionalMaterialRequestService = AdditionalMaterialRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        workflows_service_1.WorkflowsService,
        material_reservation_service_1.MaterialReservationService])
], AdditionalMaterialRequestService);
//# sourceMappingURL=additional-material-request.service.js.map