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
exports.LandedCostService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let LandedCostService = class LandedCostService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateLcNumber(companyId) {
        const count = await this.prisma.landedCost.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `LC-COST-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ipo: { select: { ipoNumber: true, currency: true, exchangeRate: true, status: true, vendor: { select: { code: true, name: true } } } },
            items: { where: { isActive: true }, orderBy: { itemCode: 'asc' } },
        };
    }
    calcTotal(dto) {
        return (dto.invoiceValue || 0) + (dto.customsDuty || 0) + (dto.freightCharges || 0) +
            (dto.chaCharges || 0) + (dto.portCharges || 0) + (dto.bankCharges || 0) +
            (dto.insuranceCharges || 0) + (dto.otherCharges || 0);
    }
    allocateCosts(items, totalLandedCost, method) {
        if (items.length === 0)
            return items;
        let totalBase = 0;
        if (method === 'BY_VALUE')
            totalBase = items.reduce((s, i) => s + i.valueInr, 0);
        else if (method === 'BY_QTY')
            totalBase = items.reduce((s, i) => s + i.qty, 0);
        else
            totalBase = items.length;
        return items.map(item => {
            const base = method === 'BY_VALUE' ? item.valueInr : method === 'BY_QTY' ? item.qty : 1;
            const allocationRatio = totalBase > 0 ? base / totalBase : 1 / items.length;
            const allocatedCost = totalLandedCost * allocationRatio;
            const landedCostPerUnit = item.qty > 0 ? (item.valueInr + allocatedCost) / item.qty : 0;
            return Object.assign(Object.assign({}, item), { allocationRatio, allocatedCost, landedCostPerUnit });
        });
    }
    async create(dto, user) {
        const ipo = await this.prisma.importPurchaseOrder.findFirst({
            where: { id: dto.ipoId, companyId: user.companyId },
            include: { items: { where: { isActive: true } } },
        });
        if (!ipo)
            throw new common_1.NotFoundException('Import PO not found');
        const lcNumber = await this.generateLcNumber(user.companyId);
        const totalLandedCost = this.calcTotal(dto);
        const rawItems = ipo.items.map(item => ({
            ipoItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            qty: item.orderedQty,
            unitPriceForeign: item.unitPriceForeign,
            valueForeign: item.totalForeign,
            valueInr: item.totalInr,
        }));
        const allocatedItems = this.allocateCosts(rawItems, totalLandedCost, dto.allocationMethod || 'BY_VALUE');
        const lc = await this.prisma.landedCost.create({
            data: Object.assign(Object.assign({}, dto), { lcNumber,
                totalLandedCost, companyId: user.companyId, createdBy: user.id, updatedBy: user.id, items: { create: allocatedItems.map(i => (Object.assign(Object.assign({}, i), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))) } }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'landed_costs', recordId: lc.id, action: 'CREATE', newValues: lc, changedBy: user.id });
        return lc;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ lcNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.landedCost.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    ipo: { select: { ipoNumber: true, currency: true, vendor: { select: { code: true, name: true } } } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.landedCost.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const lc = await this.prisma.landedCost.findFirst({ where, include: this.includes() });
        if (!lc)
            throw new common_1.NotFoundException('Landed cost not found');
        return lc;
    }
    async findByIpo(ipoId, user) {
        const where = { ipoId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.landedCost.findMany({ where, orderBy: { createdAt: 'desc' }, include: this.includes() });
    }
    async update(id, dto, user) {
        const lc = await this.findOne(id, user);
        if (lc.status === 'FINALIZED')
            throw new common_1.BadRequestException('Cannot edit finalized landed cost');
        const totalLandedCost = this.calcTotal(Object.assign(Object.assign({}, lc), dto));
        const updated = await this.prisma.landedCost.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { totalLandedCost, updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'landed_costs', recordId: id, action: 'UPDATE', oldValues: lc, newValues: updated, changedBy: user.id });
        return updated;
    }
    async calculate(id, user) {
        const lc = await this.findOne(id, user);
        if (lc.status === 'FINALIZED')
            throw new common_1.BadRequestException('Cannot recalculate finalized landed cost');
        const allocatedItems = this.allocateCosts(lc.items, lc.totalLandedCost, lc.allocationMethod);
        for (const item of allocatedItems) {
            await this.prisma.landedCostItem.update({
                where: { id: item.id },
                data: { allocationRatio: item.allocationRatio, allocatedCost: item.allocatedCost, landedCostPerUnit: item.landedCostPerUnit, updatedBy: user.id },
            });
        }
        return this.findOne(id, user);
    }
    async finalize(id, user) {
        const lc = await this.findOne(id, user);
        if (lc.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT landed costs can be finalized');
        if (!lc.items || lc.items.length === 0)
            throw new common_1.BadRequestException('Cannot finalize without items');
        const updated = await this.prisma.landedCost.update({
            where: { id }, data: { status: 'FINALIZED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'landed_costs', recordId: id, action: 'UPDATE', oldValues: lc, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, finalized] = await Promise.all([
            this.prisma.landedCost.count({ where }),
            this.prisma.landedCost.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.landedCost.count({ where: Object.assign(Object.assign({}, where), { status: 'FINALIZED' }) }),
        ]);
        const totals = await this.prisma.landedCost.aggregate({ where, _sum: { totalLandedCost: true, customsDuty: true, freightCharges: true } });
        return { total, draft, finalized, totalLandedCost: totals._sum.totalLandedCost || 0, totalCustomsDuty: totals._sum.customsDuty || 0, totalFreight: totals._sum.freightCharges || 0 };
    }
};
exports.LandedCostService = LandedCostService;
exports.LandedCostService = LandedCostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], LandedCostService);
//# sourceMappingURL=landed-cost.service.js.map