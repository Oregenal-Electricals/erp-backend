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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRequisitionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PurchaseRequisitionService = class PurchaseRequisitionService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generatePrNumber(companyId) {
        const count = await this.prisma.purchaseRequisition.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PR-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } };
    }
    async create(dto, user) {
        const prNumber = await this.generatePrNumber(user.companyId);
        const { items } = dto, prData = __rest(dto, ["items"]);
        if (prData.requiredDate && typeof prData.requiredDate === 'string') {
            prData.requiredDate = new Date(prData.requiredDate);
        }
        const pr = await this.prisma.purchaseRequisition.create({
            data: Object.assign(Object.assign({}, prData), { prNumber, requestedBy: user.id, companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: items && items.length > 0 ? {
                    create: items.map((item, idx) => (Object.assign(Object.assign({}, item), { sequence: item.sequence || idx + 1, estimatedTotal: item.estimatedUnitPrice ? item.requiredQty * item.estimatedUnitPrice : null, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))),
                } : undefined }),
            include: this.includes(),
        });
        if (pr.items.length > 0) {
            const total = pr.items.reduce((s, i) => s + (i.estimatedTotal || 0), 0);
            await this.prisma.purchaseRequisition.update({ where: { id: pr.id }, data: { totalAmount: total } });
        }
        await this.audit.log({ tableName: 'purchase_requisitions', recordId: pr.id, action: 'CREATE', newValues: pr, changedBy: user.id });
        return pr;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, priority } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { prNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        const [data, total] = await Promise.all([
            this.prisma.purchaseRequisition.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { _count: { select: { items: true } } },
            }),
            this.prisma.purchaseRequisition.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const pr = await this.prisma.purchaseRequisition.findFirst({ where, include: this.includes() });
        if (!pr)
            throw new common_1.NotFoundException('Purchase Requisition not found');
        return pr;
    }
    async update(id, dto, user) {
        const pr = await this.findOne(id, user);
        if (!['DRAFT', 'REJECTED'].includes(pr.status))
            throw new common_1.BadRequestException('Only DRAFT or REJECTED PRs can be edited');
        const updated = await this.prisma.purchaseRequisition.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
        return updated;
    }
    async submit(id, user) {
        const pr = await this.findOne(id, user);
        if (pr.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT PRs can be submitted');
        if (!pr.items || pr.items.length === 0)
            throw new common_1.BadRequestException('Cannot submit PR with no items');
        const updated = await this.prisma.purchaseRequisition.update({
            where: { id }, data: { status: 'SUBMITTED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
        return updated;
    }
    async approve(id, user) {
        const pr = await this.findOne(id, user);
        if (pr.status !== 'SUBMITTED')
            throw new common_1.BadRequestException('Only SUBMITTED PRs can be approved');
        const updated = await this.prisma.purchaseRequisition.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
        return updated;
    }
    async reject(id, dto, user) {
        const pr = await this.findOne(id, user);
        if (pr.status !== 'SUBMITTED')
            throw new common_1.BadRequestException('Only SUBMITTED PRs can be rejected');
        const updated = await this.prisma.purchaseRequisition.update({
            where: { id },
            data: { status: 'REJECTED', rejectedBy: user.id, rejectedAt: new Date(), rejectionReason: dto.rejectionReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'purchase_requisitions', recordId: id, action: 'UPDATE', oldValues: pr, newValues: updated, changedBy: user.id });
        return updated;
    }
    async addItem(id, item, user) {
        var _a;
        const pr = await this.findOne(id, user);
        if (!['DRAFT', 'REJECTED'].includes(pr.status))
            throw new common_1.BadRequestException('Cannot add items to this PR');
        const seq = (((_a = pr.items) === null || _a === void 0 ? void 0 : _a.length) || 0) + 1;
        const newItem = await this.prisma.purchaseRequisitionItem.create({
            data: Object.assign(Object.assign({}, item), { prId: id, sequence: item.sequence || seq, estimatedTotal: item.estimatedUnitPrice ? item.requiredQty * item.estimatedUnitPrice : null, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.recalculateTotal(id);
        return newItem;
    }
    async removeItem(id, itemId, user) {
        const pr = await this.findOne(id, user);
        if (!['DRAFT', 'REJECTED'].includes(pr.status))
            throw new common_1.BadRequestException('Cannot remove items from this PR');
        await this.prisma.purchaseRequisitionItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
        await this.recalculateTotal(id);
        return { message: 'Item removed' };
    }
    async recalculateTotal(prId) {
        const items = await this.prisma.purchaseRequisitionItem.findMany({ where: { prId, isActive: true } });
        const total = items.reduce((s, i) => s + (i.estimatedTotal || 0), 0);
        await this.prisma.purchaseRequisition.update({ where: { id: prId }, data: { totalAmount: total } });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, submitted, approved, rejected, poRaised] = await Promise.all([
            this.prisma.purchaseRequisition.count({ where }),
            this.prisma.purchaseRequisition.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.purchaseRequisition.count({ where: Object.assign(Object.assign({}, where), { status: 'SUBMITTED' }) }),
            this.prisma.purchaseRequisition.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.purchaseRequisition.count({ where: Object.assign(Object.assign({}, where), { status: 'REJECTED' }) }),
            this.prisma.purchaseRequisition.count({ where: Object.assign(Object.assign({}, where), { status: 'PO_RAISED' }) }),
        ]);
        return { total, draft, submitted, approved, rejected, poRaised };
    }
};
exports.PurchaseRequisitionService = PurchaseRequisitionService;
exports.PurchaseRequisitionService = PurchaseRequisitionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PurchaseRequisitionService);
//# sourceMappingURL=purchase-requisition.service.js.map