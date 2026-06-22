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
exports.RfqService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RfqService = class RfqService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateRfqNumber(companyId) {
        const count = await this.prisma.rfq.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `RFQ-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            pr: { select: { prNumber: true, title: true, status: true } },
            vendors: { where: { isActive: true }, include: { vendor: { select: { code: true, name: true, email: true, phone: true } } } },
            items: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        };
    }
    async create(dto, user) {
        const pr = await this.prisma.purchaseRequisition.findFirst({
            where: { id: dto.prId, companyId: user.companyId },
            include: { items: { where: { isActive: true } } },
        });
        if (!pr)
            throw new common_1.NotFoundException('Purchase Requisition not found');
        if (pr.status !== 'APPROVED')
            throw new common_1.BadRequestException('Only approved PRs can have RFQs');
        const rfqNumber = await this.generateRfqNumber(user.companyId);
        const { vendorIds, prItemIds } = dto, rfqData = __rest(dto, ["vendorIds", "prItemIds"]);
        const itemsToAdd = (prItemIds === null || prItemIds === void 0 ? void 0 : prItemIds.length)
            ? pr.items.filter(i => prItemIds.includes(i.id))
            : pr.items;
        const rfq = await this.prisma.rfq.create({
            data: Object.assign(Object.assign({}, rfqData), { rfqNumber, responseDeadline: new Date(dto.responseDeadline), companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: {
                    create: itemsToAdd.map(item => ({
                        prItemId: item.id,
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        uom: item.uom,
                        requiredQty: item.requiredQty,
                        companyId: user.companyId,
                        createdBy: user.id,
                        updatedBy: user.id,
                    })),
                }, vendors: (vendorIds === null || vendorIds === void 0 ? void 0 : vendorIds.length) ? {
                    create: vendorIds.map(vendorId => ({
                        vendorId,
                        companyId: user.companyId,
                        createdBy: user.id,
                        updatedBy: user.id,
                    })),
                } : undefined }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'rfqs', recordId: rfq.id, action: 'CREATE', newValues: rfq, changedBy: user.id });
        return rfq;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { rfqNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.rfq.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    pr: { select: { prNumber: true, title: true } },
                    _count: { select: { vendors: true, items: true } },
                },
            }),
            this.prisma.rfq.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const rfq = await this.prisma.rfq.findFirst({ where, include: this.includes() });
        if (!rfq)
            throw new common_1.NotFoundException('RFQ not found');
        return rfq;
    }
    async update(id, dto, user) {
        const rfq = await this.findOne(id, user);
        if (!['DRAFT'].includes(rfq.status))
            throw new common_1.BadRequestException('Only DRAFT RFQs can be edited');
        const updated = await this.prisma.rfq.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { responseDeadline: dto.responseDeadline ? new Date(dto.responseDeadline) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
        return updated;
    }
    async send(id, user) {
        const rfq = await this.findOne(id, user);
        if (rfq.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT RFQs can be sent');
        if (!rfq.vendors || rfq.vendors.length === 0)
            throw new common_1.BadRequestException('Add at least one vendor before sending');
        if (!rfq.items || rfq.items.length === 0)
            throw new common_1.BadRequestException('Add at least one item before sending');
        const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'SENT', updatedBy: user.id }, include: this.includes() });
        await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
        return updated;
    }
    async close(id, user) {
        const rfq = await this.findOne(id, user);
        if (rfq.status !== 'SENT')
            throw new common_1.BadRequestException('Only SENT RFQs can be closed');
        const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), updatedBy: user.id }, include: this.includes() });
        await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const rfq = await this.findOne(id, user);
        if (rfq.status === 'CANCELLED')
            throw new common_1.BadRequestException('Already cancelled');
        const updated = await this.prisma.rfq.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
        await this.audit.log({ tableName: 'rfqs', recordId: id, action: 'UPDATE', oldValues: rfq, newValues: updated, changedBy: user.id });
        return updated;
    }
    async addVendor(id, dto, user) {
        const rfq = await this.findOne(id, user);
        if (rfq.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cannot add vendors to cancelled RFQ');
        const vendor = await this.prisma.vendor.findFirst({ where: { id: dto.vendorId, companyId: user.companyId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const rv = await this.prisma.rfqVendor.upsert({
            where: { rfqId_vendorId: { rfqId: id, vendorId: dto.vendorId } },
            create: { rfqId: id, vendorId: dto.vendorId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id },
            update: { isActive: true, status: 'INVITED', updatedBy: user.id },
            include: { vendor: { select: { code: true, name: true } } },
        });
        return rv;
    }
    async removeVendor(id, vendorId, user) {
        await this.findOne(id, user);
        await this.prisma.rfqVendor.updateMany({ where: { rfqId: id, vendorId }, data: { isActive: false, updatedBy: user.id } });
        return { message: 'Vendor removed from RFQ' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, sent, closed, cancelled] = await Promise.all([
            this.prisma.rfq.count({ where }),
            this.prisma.rfq.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.rfq.count({ where: Object.assign(Object.assign({}, where), { status: 'SENT' }) }),
            this.prisma.rfq.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
            this.prisma.rfq.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        return { total, draft, sent, closed, cancelled };
    }
};
exports.RfqService = RfqService;
exports.RfqService = RfqService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RfqService);
//# sourceMappingURL=rfq.service.js.map