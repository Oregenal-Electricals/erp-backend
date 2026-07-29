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
exports.PoApprovalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PoApprovalService = class PoApprovalService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getSettings(user) {
        return this.prisma.poApprovalSetting.findMany({
            where: { companyId: user.companyId },
            orderBy: { level: 'asc' },
        });
    }
    async createSetting(dto, user) {
        const existing = await this.prisma.poApprovalSetting.findUnique({
            where: { companyId_level: { companyId: user.companyId, level: dto.level } },
        });
        if (existing)
            throw new common_1.BadRequestException(`Level ${dto.level} already exists`);
        return this.prisma.poApprovalSetting.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
    }
    async updateSetting(id, dto, user) {
        const setting = await this.prisma.poApprovalSetting.findFirst({ where: { id, companyId: user.companyId } });
        if (!setting)
            throw new common_1.NotFoundException('Approval setting not found');
        return this.prisma.poApprovalSetting.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
    }
    async getRequiredLevels(companyId, amount) {
        const settings = await this.prisma.poApprovalSetting.findMany({
            where: { companyId, isActive: true },
            orderBy: { level: 'asc' },
        });
        if (settings.length === 0)
            return [1];
        const required = settings.filter(s => amount >= s.minAmount && (s.maxAmount === null || amount <= s.maxAmount));
        if (required.length === 0)
            return settings.map(s => s.level);
        return required.map(s => s.level);
    }
    async getPending(user) {
        const pos = await this.prisma.purchaseOrder.findMany({
            where: { companyId: user.companyId, status: 'DRAFT', isActive: true },
            include: {
                vendor: { select: { code: true, name: true } },
                approvals: { orderBy: { createdAt: 'desc' } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return pos.map(po => {
            const lastAction = po.approvals[0];
            return Object.assign(Object.assign({}, po), { lastApprovalAction: (lastAction === null || lastAction === void 0 ? void 0 : lastAction.action) || null, lastApprovalBy: (lastAction === null || lastAction === void 0 ? void 0 : lastAction.approvedBy) || null, lastRemarks: (lastAction === null || lastAction === void 0 ? void 0 : lastAction.remarks) || null });
        });
    }
    async getHistory(poId, user) {
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        return this.prisma.poApproval.findMany({
            where: { poId, companyId: user.companyId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async approve(poId, dto, user) {
        const po = await this.prisma.purchaseOrder.findFirst({
            where: { id: poId, companyId: user.companyId },
            include: { approvals: true },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        if (!['DRAFT'].includes(po.status))
            throw new common_1.BadRequestException('Only DRAFT POs can be approved');
        const itemCount = await this.prisma.purchaseOrderItem.count({ where: { poId, isActive: true } });
        if (itemCount === 0)
            throw new common_1.BadRequestException('Cannot approve PO with no items');
        const requiredLevels = await this.getRequiredLevels(user.companyId, po.totalAmount);
        const approvedLevels = po.approvals.filter(a => a.action === 'APPROVED').map(a => a.approvalLevel);
        const nextLevel = requiredLevels.find(l => !approvedLevels.includes(l)) || 1;
        const approval = await this.prisma.poApproval.create({
            data: {
                companyId: user.companyId, poId,
                approvalLevel: nextLevel,
                approvedBy: user.id,
                action: 'APPROVED',
                remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        const newApprovedLevels = [...approvedLevels, nextLevel];
        const allApproved = requiredLevels.every(l => newApprovedLevels.includes(l));
        if (allApproved) {
            await this.prisma.purchaseOrder.update({
                where: { id: poId },
                data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            });
        }
        await this.audit.log({ tableName: 'po_approvals', recordId: approval.id, action: 'CREATE', newValues: approval, changedBy: user.id });
        return {
            approval,
            allApproved,
            levelsApproved: newApprovedLevels,
            levelsRequired: requiredLevels,
            poStatus: allApproved ? 'APPROVED' : 'DRAFT',
            message: allApproved ? 'PO fully approved' : `Level ${nextLevel} approved. ${requiredLevels.length - newApprovedLevels.length} level(s) remaining.`,
        };
    }
    async reject(poId, dto, user) {
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT POs can be rejected');
        const approval = await this.prisma.poApproval.create({
            data: {
                companyId: user.companyId, poId,
                approvalLevel: 1,
                approvedBy: user.id,
                action: 'REJECTED',
                remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'po_approvals', recordId: approval.id, action: 'CREATE', newValues: approval, changedBy: user.id });
        return { approval, message: 'PO rejected', poStatus: 'DRAFT' };
    }
    async getStats(user) {
        const where = { companyId: user.companyId };
        const [total, approved, rejected, pending] = await Promise.all([
            this.prisma.poApproval.count({ where }),
            this.prisma.poApproval.count({ where: Object.assign(Object.assign({}, where), { action: 'APPROVED' }) }),
            this.prisma.poApproval.count({ where: Object.assign(Object.assign({}, where), { action: 'REJECTED' }) }),
            this.prisma.purchaseOrder.count({ where: { companyId: user.companyId, status: 'DRAFT', isActive: true } }),
        ]);
        return { total, approved, rejected, pendingPos: pending };
    }
};
exports.PoApprovalService = PoApprovalService;
exports.PoApprovalService = PoApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PoApprovalService);
//# sourceMappingURL=po-approval.service.js.map