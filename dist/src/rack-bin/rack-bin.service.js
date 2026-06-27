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
exports.RackBinService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RackBinService = class RackBinService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createZone(dto, user) {
        const existing = await this.prisma.warehouseZone.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
        if (existing)
            throw new common_1.ConflictException(`Zone ${dto.code} already exists`);
        return this.prisma.warehouseZone.create({ data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }) });
    }
    async findZones(warehouseId, user) {
        return this.prisma.warehouseZone.findMany({
            where: { warehouseId, companyId: user.companyId, isActive: true },
            include: { _count: { select: { racks: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async createRack(dto, user) {
        const existing = await this.prisma.warehouseRack.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
        if (existing)
            throw new common_1.ConflictException(`Rack ${dto.code} already exists`);
        return this.prisma.warehouseRack.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: { zone: { select: { code: true, name: true } } },
        });
    }
    async findRacks(warehouseId, user, zoneId) {
        const where = { warehouseId, companyId: user.companyId, isActive: true };
        if (zoneId)
            where.zoneId = zoneId;
        return this.prisma.warehouseRack.findMany({
            where,
            include: {
                zone: { select: { code: true, name: true } },
                _count: { select: { bins: true } },
            },
            orderBy: { code: 'asc' },
        });
    }
    async createBin(dto, user) {
        const existing = await this.prisma.warehouseBin.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code: dto.code } });
        if (existing)
            throw new common_1.ConflictException(`Bin ${dto.code} already exists`);
        return this.prisma.warehouseBin.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: { rack: { select: { code: true, name: true } } },
        });
    }
    async bulkCreateBins(dto, user) {
        const bins = [];
        for (let i = 1; i <= dto.count; i++) {
            const code = `${dto.prefix}-${String(i).padStart(2, '0')}`;
            const existing = await this.prisma.warehouseBin.findFirst({ where: { companyId: user.companyId, warehouseId: dto.warehouseId, code } });
            if (!existing) {
                bins.push({ code, warehouseId: dto.warehouseId, rackId: dto.rackId, maxQty: dto.maxQty, companyId: user.companyId, createdBy: user.id, updatedBy: user.id });
            }
        }
        await this.prisma.warehouseBin.createMany({ data: bins });
        const totalBins = await this.prisma.warehouseBin.count({ where: { rackId: dto.rackId, companyId: user.companyId } });
        await this.prisma.warehouseRack.update({ where: { id: dto.rackId }, data: { totalBins, updatedBy: user.id } });
        return { created: bins.length, message: `${bins.length} bins created` };
    }
    async findBins(rackId, user) {
        return this.prisma.warehouseBin.findMany({
            where: { rackId, companyId: user.companyId, isActive: true },
            include: { rack: { select: { code: true, name: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async findEmptyBins(warehouseId, user) {
        return this.prisma.warehouseBin.findMany({
            where: { warehouseId, companyId: user.companyId, status: 'EMPTY', isActive: true },
            include: { rack: { select: { code: true, name: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async updateBinStatus(id, dto, user) {
        return this.prisma.warehouseBin.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
    }
    async getWarehouseStats(warehouseId, user) {
        const where = { warehouseId, companyId: user.companyId };
        const [totalZones, totalRacks, totalBins, emptyBins, partialBins, fullBins] = await Promise.all([
            this.prisma.warehouseZone.count({ where }),
            this.prisma.warehouseRack.count({ where }),
            this.prisma.warehouseBin.count({ where }),
            this.prisma.warehouseBin.count({ where: Object.assign(Object.assign({}, where), { status: 'EMPTY' }) }),
            this.prisma.warehouseBin.count({ where: Object.assign(Object.assign({}, where), { status: 'PARTIAL' }) }),
            this.prisma.warehouseBin.count({ where: Object.assign(Object.assign({}, where), { status: 'FULL' }) }),
        ]);
        const utilization = totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0;
        return { totalZones, totalRacks, totalBins, emptyBins, partialBins, fullBins, utilization };
    }
};
exports.RackBinService = RackBinService;
exports.RackBinService = RackBinService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RackBinService);
//# sourceMappingURL=rack-bin.service.js.map