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
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let WarehouseService = class WarehouseService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createWarehouse(dto, user) {
        const exists = await this.prisma.warehouse.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Warehouse ${dto.code} already exists`);
        const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const wh = await this.prisma.warehouse.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.whIncludes(),
        });
        await this.audit.log({ tableName: 'warehouses', recordId: wh.id, action: 'CREATE', newValues: wh, changedBy: user.id });
        return wh;
    }
    async findAllWarehouses(user, plantId) {
        const where = { companyId: user.companyId };
        if (plantId)
            where.plantId = plantId;
        return this.prisma.warehouse.findMany({
            where,
            include: {
                plant: { select: { id: true, name: true, code: true } },
                _count: { select: { zones: true } },
            },
            orderBy: { code: 'asc' },
        });
    }
    async findOneWarehouse(id) {
        const wh = await this.prisma.warehouse.findUnique({
            where: { id },
            include: {
                plant: { select: { id: true, name: true, code: true } },
                zones: {
                    include: {
                        racks: {
                            include: {
                                bins: true,
                                _count: { select: { bins: true } },
                            },
                            orderBy: { code: 'asc' },
                        },
                        _count: { select: { racks: true } },
                    },
                    orderBy: { code: 'asc' },
                },
            },
        });
        if (!wh)
            throw new common_1.NotFoundException('Warehouse not found');
        return wh;
    }
    async updateWarehouse(id, dto, user) {
        const wh = await this.prisma.warehouse.findUnique({ where: { id } });
        if (!wh)
            throw new common_1.NotFoundException('Warehouse not found');
        const updated = await this.prisma.warehouse.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.whIncludes() });
        await this.audit.log({ tableName: 'warehouses', recordId: id, action: 'UPDATE', oldValues: wh, newValues: dto, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const base = { companyId: user.companyId };
        const [totalWarehouses, totalZones, totalRacks, totalBins] = await Promise.all([
            this.prisma.warehouse.count({ where: base }),
            this.prisma.zone.count({ where: { warehouse: { companyId: user.companyId } } }),
            this.prisma.rack.count({ where: { zone: { warehouse: { companyId: user.companyId } } } }),
            this.prisma.bin.count({ where: { rack: { zone: { warehouse: { companyId: user.companyId } } } } }),
        ]);
        return { totalWarehouses, totalZones, totalRacks, totalBins };
    }
    async createZone(dto, user) {
        const wh = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
        if (!wh)
            throw new common_1.NotFoundException('Warehouse not found');
        const exists = await this.prisma.zone.findUnique({
            where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Zone ${dto.code} already exists in this warehouse`);
        return this.prisma.zone.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id }),
            include: { warehouse: { select: { id: true, name: true } } },
        });
    }
    async findZonesByWarehouse(warehouseId) {
        return this.prisma.zone.findMany({
            where: { warehouseId, isActive: true },
            include: { _count: { select: { racks: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async createRack(dto, user) {
        const zone = await this.prisma.zone.findUnique({ where: { id: dto.zoneId } });
        if (!zone)
            throw new common_1.NotFoundException('Zone not found');
        const exists = await this.prisma.rack.findUnique({
            where: { zoneId_code: { zoneId: dto.zoneId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Rack ${dto.code} already exists in this zone`);
        return this.prisma.rack.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id }),
            include: { zone: { select: { id: true, name: true } } },
        });
    }
    async findRacksByZone(zoneId) {
        return this.prisma.rack.findMany({
            where: { zoneId, isActive: true },
            include: { _count: { select: { bins: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async createBin(dto, user) {
        const rack = await this.prisma.rack.findUnique({ where: { id: dto.rackId } });
        if (!rack)
            throw new common_1.NotFoundException('Rack not found');
        const exists = await this.prisma.bin.findUnique({
            where: { rackId_code: { rackId: dto.rackId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Bin ${dto.code} already exists in this rack`);
        return this.prisma.bin.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), createdBy: user.id, updatedBy: user.id }),
            include: { rack: { select: { id: true, name: true } } },
        });
    }
    async findBinsByRack(rackId) {
        return this.prisma.bin.findMany({
            where: { rackId, isActive: true },
            orderBy: { code: 'asc' },
        });
    }
    whIncludes() {
        return { plant: { select: { id: true, name: true, code: true } } };
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map