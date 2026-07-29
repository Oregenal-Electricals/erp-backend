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
exports.ShipmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ShipmentService = class ShipmentService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.shipment.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `SHP-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ipo: { select: { ipoNumber: true, currency: true, status: true, vendor: { select: { code: true, name: true } } } },
            containers: { where: { isActive: true } },
        };
    }
    async create(dto, user) {
        const ipo = await this.prisma.importPurchaseOrder.findFirst({
            where: { id: dto.ipoId, companyId: user.companyId },
        });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        if (!['LC_OPENED', 'PROFORMA_RECEIVED', 'SHIPPED'].includes(ipo.status)) {
            throw new common_1.BadRequestException('Import PO must have LC opened before creating shipment');
        }
        const shipmentNumber = await this.generateNumber(user.companyId);
        const shipment = await this.prisma.shipment.create({
            data: Object.assign(Object.assign({}, dto), { shipmentNumber, etd: dto.etd ? new Date(dto.etd) : undefined, eta: dto.eta ? new Date(dto.eta) : undefined, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipments', recordId: shipment.id, action: 'CREATE', newValues: shipment, changedBy: user.id });
        return shipment;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, shipmentMode } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { shipmentNumber: { contains: search, mode: 'insensitive' } },
                { vesselName: { contains: search, mode: 'insensitive' } },
                { blNumber: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (shipmentMode)
            where.shipmentMode = shipmentMode;
        const [data, total] = await Promise.all([
            this.prisma.shipment.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
                    _count: { select: { containers: true } },
                },
            }),
            this.prisma.shipment.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const shipment = await this.prisma.shipment.findFirst({ where, include: this.includes() });
        if (!shipment)
            throw new common_1.NotFoundException('Shipment not found');
        return shipment;
    }
    async findByIpo(ipoId, user) {
        const where = { ipoId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.shipment.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
    }
    async update(id, dto, user) {
        const shipment = await this.findOne(id, user);
        if (['DELIVERED', 'CANCELLED'].includes(shipment.status))
            throw new common_1.BadRequestException('Cannot edit delivered or cancelled shipment');
        const updated = await this.prisma.shipment.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { etd: dto.etd ? new Date(dto.etd) : undefined, eta: dto.eta ? new Date(dto.eta) : undefined, atd: dto.atd ? new Date(dto.atd) : undefined, ata: dto.ata ? new Date(dto.ata) : undefined, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
        return updated;
    }
    async depart(id, user) {
        const shipment = await this.findOne(id, user);
        if (shipment.status !== 'BOOKED')
            throw new common_1.BadRequestException('Only BOOKED shipments can depart');
        const updated = await this.prisma.shipment.update({
            where: { id }, data: { status: 'DEPARTED', atd: new Date(), updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
        return updated;
    }
    async arrive(id, user) {
        const shipment = await this.findOne(id, user);
        if (!['DEPARTED', 'IN_TRANSIT'].includes(shipment.status))
            throw new common_1.BadRequestException('Only DEPARTED or IN_TRANSIT shipments can arrive');
        const updated = await this.prisma.shipment.update({
            where: { id }, data: { status: 'ARRIVED', ata: new Date(), updatedBy: user.id }, include: this.includes(),
        });
        await this.prisma.importPurchaseOrder.update({
            where: { id: shipment.ipoId }, data: { status: 'SHIPPED', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
        return updated;
    }
    async deliver(id, user) {
        const shipment = await this.findOne(id, user);
        if (shipment.status !== 'ARRIVED')
            throw new common_1.BadRequestException('Only ARRIVED shipments can be delivered');
        const updated = await this.prisma.shipment.update({
            where: { id }, data: { status: 'DELIVERED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const shipment = await this.findOne(id, user);
        if (['DELIVERED', 'CANCELLED'].includes(shipment.status))
            throw new common_1.BadRequestException('Cannot cancel delivered or already cancelled shipment');
        const updated = await this.prisma.shipment.update({
            where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'shipments', recordId: id, action: 'UPDATE', oldValues: shipment, newValues: updated, changedBy: user.id });
        return updated;
    }
    async addContainer(id, dto, user) {
        const shipment = await this.findOne(id, user);
        if (shipment.shipmentMode !== 'SEA')
            throw new common_1.BadRequestException('Containers are only for SEA shipments');
        if (['DELIVERED', 'CANCELLED'].includes(shipment.status))
            throw new common_1.BadRequestException('Cannot add containers to delivered or cancelled shipment');
        return this.prisma.shipmentContainer.create({
            data: Object.assign(Object.assign({}, dto), { shipmentId: id, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, booked, departed, arrived, delivered, cancelled] = await Promise.all([
            this.prisma.shipment.count({ where }),
            this.prisma.shipment.count({ where: Object.assign(Object.assign({}, where), { status: 'BOOKED' }) }),
            this.prisma.shipment.count({ where: Object.assign(Object.assign({}, where), { status: 'DEPARTED' }) }),
            this.prisma.shipment.count({ where: Object.assign(Object.assign({}, where), { status: 'ARRIVED' }) }),
            this.prisma.shipment.count({ where: Object.assign(Object.assign({}, where), { status: 'DELIVERED' }) }),
            this.prisma.shipment.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const byMode = await this.prisma.shipment.groupBy({ by: ['shipmentMode'], where, _count: true });
        return { total, booked, departed, arrived, delivered, cancelled, byMode };
    }
};
exports.ShipmentService = ShipmentService;
exports.ShipmentService = ShipmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ShipmentService);
//# sourceMappingURL=shipment.service.js.map