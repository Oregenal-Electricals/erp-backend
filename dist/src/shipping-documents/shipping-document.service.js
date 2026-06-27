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
exports.ShippingDocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ShippingDocumentService = class ShippingDocumentService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            shipment: { select: { shipmentNumber: true, shipmentMode: true, status: true, vesselName: true, carrierName: true } },
            ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
        };
    }
    async create(dto, user) {
        const shipment = await this.prisma.shipment.findFirst({ where: { id: dto.shipmentId, companyId: user.companyId } });
        if (!shipment)
            throw new common_1.NotFoundException('Shipment not found');
        const doc = await this.prisma.shippingDocument.create({
            data: Object.assign(Object.assign({}, dto), { issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipping_documents', recordId: doc.id, action: 'CREATE', newValues: doc, changedBy: user.id });
        return doc;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, documentType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { documentNumber: { contains: search, mode: 'insensitive' } },
                { shipperName: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (documentType)
            where.documentType = documentType;
        const [data, total] = await Promise.all([
            this.prisma.shippingDocument.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.shippingDocument.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const doc = await this.prisma.shippingDocument.findFirst({ where, include: this.includes() });
        if (!doc)
            throw new common_1.NotFoundException('Shipping document not found');
        return doc;
    }
    async findByShipment(shipmentId, user) {
        const where = { shipmentId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.shippingDocument.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
    }
    async update(id, dto, user) {
        const doc = await this.findOne(id, user);
        if (doc.status === 'SURRENDERED')
            throw new common_1.BadRequestException('Cannot edit surrendered document');
        const updated = await this.prisma.shippingDocument.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
        return updated;
    }
    async verify(id, user) {
        const doc = await this.findOne(id, user);
        if (doc.status !== 'RECEIVED')
            throw new common_1.BadRequestException('Only RECEIVED documents can be verified');
        const updated = await this.prisma.shippingDocument.update({
            where: { id }, data: { status: 'VERIFIED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
        return updated;
    }
    async surrender(id, user) {
        const doc = await this.findOne(id, user);
        if (doc.status !== 'VERIFIED')
            throw new common_1.BadRequestException('Only VERIFIED documents can be surrendered');
        const updated = await this.prisma.shippingDocument.update({
            where: { id }, data: { status: 'SURRENDERED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipping_documents', recordId: id, action: 'UPDATE', oldValues: doc, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, received, verified, surrendered] = await Promise.all([
            this.prisma.shippingDocument.count({ where }),
            this.prisma.shippingDocument.count({ where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }) }),
            this.prisma.shippingDocument.count({ where: Object.assign(Object.assign({}, where), { status: 'VERIFIED' }) }),
            this.prisma.shippingDocument.count({ where: Object.assign(Object.assign({}, where), { status: 'SURRENDERED' }) }),
        ]);
        const byType = await this.prisma.shippingDocument.groupBy({ by: ['documentType'], where, _count: true });
        return { total, received, verified, surrendered, byType };
    }
};
exports.ShippingDocumentService = ShippingDocumentService;
exports.ShippingDocumentService = ShippingDocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ShippingDocumentService);
//# sourceMappingURL=shipping-document.service.js.map