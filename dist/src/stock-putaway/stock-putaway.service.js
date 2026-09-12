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
exports.StockPutawayService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let StockPutawayService = class StockPutawayService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.stockPutaway.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PUT-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            grn: { select: { grnNumber: true, grnType: true } },
            iqc: { select: { iqcNumber: true } },
            warehouse: { select: { name: true, code: true } },
            items: { where: { isActive: true }, include: { bin: { select: { code: true, status: true } } } },
        };
    }
    async getPendingIqcs(user) {
        const where = { status: 'APPROVED', isActive: true };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const approvedIqcs = await this.prisma.iqcInspection.findMany({
            where,
            include: {
                grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
                items: { where: { isActive: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const itemCodes = [...new Set(approvedIqcs.flatMap((iqc) => iqc.items.map((i) => i.itemCode)))];
        const materials = itemCodes.length > 0 ? await this.prisma.rawMaterial.findMany({
            where: { companyId: user.companyId, code: { in: itemCodes } },
            select: {
                code: true,
                preferredWarehouseId: true, preferredWarehouse: { select: { name: true } },
                preferredRackId: true, preferredRack: { select: { code: true } },
                preferredBinId: true, preferredBin: { select: { code: true } },
            },
        }) : [];
        const suggestionByCode = new Map(materials.map(m => [m.code, m]));
        return approvedIqcs
            .map((iqc) => (Object.assign(Object.assign({}, iqc), { items: iqc.items.map((item) => {
                var _a, _b, _c;
                const suggestion = suggestionByCode.get(item.itemCode);
                return Object.assign(Object.assign({}, item), { remainingPutAwayQty: Math.max(item.acceptedQty - (item.putAwayQty || 0), 0), suggestedLocation: (suggestion === null || suggestion === void 0 ? void 0 : suggestion.preferredBinId) ? {
                        warehouseId: suggestion.preferredWarehouseId, warehouseName: (_a = suggestion.preferredWarehouse) === null || _a === void 0 ? void 0 : _a.name,
                        rackId: suggestion.preferredRackId, rackCode: (_b = suggestion.preferredRack) === null || _b === void 0 ? void 0 : _b.code,
                        binId: suggestion.preferredBinId, binCode: (_c = suggestion.preferredBin) === null || _c === void 0 ? void 0 : _c.code,
                    } : null });
            }) })))
            .filter((iqc) => iqc.items.some((item) => item.remainingPutAwayQty > 0));
    }
    async create(dto, user) {
        const grn = await this.prisma.grnHeader.findFirst({ where: { id: dto.grnId, companyId: user.companyId } });
        if (!grn)
            throw new common_1.NotFoundException('GRN not found');
        const putawayNumber = await this.generateNumber(user.companyId);
        let itemsData;
        if (dto.items) {
            itemsData = [];
            for (const item of dto.items) {
                let stockBatchId;
                if (item.iqcItemId) {
                    const iqcItem = await this.prisma.iqcItem.findUnique({ where: { id: item.iqcItemId } });
                    if (iqcItem === null || iqcItem === void 0 ? void 0 : iqcItem.batchNumber) {
                        const batch = await this.prisma.stockBatch.findFirst({ where: { companyId: user.companyId, batchNumber: iqcItem.batchNumber } });
                        if (batch)
                            stockBatchId = batch.id;
                    }
                }
                itemsData.push(Object.assign(Object.assign({}, item), { stockBatchId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }));
            }
        }
        const putaway = await this.prisma.stockPutaway.create({
            data: {
                putawayNumber, grnId: dto.grnId, iqcId: dto.iqcId,
                warehouseId: dto.warehouseId, remarks: dto.remarks,
                status: 'IN_PROGRESS',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: itemsData ? { create: itemsData } : undefined,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_putaway', recordId: putaway.id, action: 'CREATE', newValues: putaway, changedBy: user.id });
        return putaway;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ putawayNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.stockPutaway.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    grn: { select: { grnNumber: true } },
                    warehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.stockPutaway.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const putaway = await this.prisma.stockPutaway.findFirst({ where, include: this.includes() });
        if (!putaway)
            throw new common_1.NotFoundException('Putaway not found');
        return putaway;
    }
    async updateItems(id, dto, user) {
        const putaway = await this.findOne(id, user);
        if (putaway.status === 'COMPLETED')
            throw new common_1.BadRequestException('Cannot edit completed putaway');
        await this.prisma.stockPutawayItem.deleteMany({ where: { putawayId: id } });
        await this.prisma.stockPutaway.update({
            where: { id },
            data: {
                items: { create: dto.items.map(item => (Object.assign(Object.assign({}, item), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))) },
                updatedBy: user.id,
            },
        });
        return this.findOne(id, user);
    }
    async complete(id, user) {
        var _a, _b;
        const putaway = await this.findOne(id, user);
        if (putaway.status === 'COMPLETED')
            throw new common_1.BadRequestException('Already completed');
        if (!putaway.items || putaway.items.length === 0)
            throw new common_1.BadRequestException('No items to putaway');
        const qtyByIqcItemId = new Map();
        for (const item of putaway.items) {
            if (!item.iqcItemId)
                continue;
            qtyByIqcItemId.set(item.iqcItemId, (qtyByIqcItemId.get(item.iqcItemId) || 0) + item.qty);
        }
        for (const [iqcItemId, qty] of qtyByIqcItemId) {
            const iqcItem = await this.prisma.iqcItem.findUnique({ where: { id: iqcItemId } });
            if (!iqcItem)
                continue;
            const remaining = iqcItem.acceptedQty - (iqcItem.putAwayQty || 0);
            if (qty > remaining) {
                throw new common_1.BadRequestException(`Item ${iqcItem.itemCode}: putting away ${qty} would exceed the remaining accepted qty (${remaining} left of ${iqcItem.acceptedQty} accepted, ${iqcItem.putAwayQty || 0} already put away).`);
            }
            const claim = await this.prisma.iqcItem.updateMany({
                where: { id: iqcItemId, putAwayQty: { lte: iqcItem.acceptedQty - qty } },
                data: { putAwayQty: { increment: qty }, updatedBy: user.id },
            });
            if (claim.count === 0) {
                throw new common_1.BadRequestException(`Item ${iqcItem.itemCode}: could not claim ${qty} for put-away - the remaining accepted qty changed concurrently, please retry.`);
            }
        }
        const bins = new Map();
        for (const item of putaway.items) {
            const bin = await this.prisma.warehouseBin.findUnique({ where: { id: item.binId } });
            if (!bin)
                continue;
            const alreadyPlanned = (_b = (_a = bins.get(item.binId)) === null || _a === void 0 ? void 0 : _a.currentQty) !== null && _b !== void 0 ? _b : bin.currentQty;
            const newQty = alreadyPlanned + item.qty;
            if (bin.maxQty && newQty > bin.maxQty) {
                throw new common_1.BadRequestException(`Bin ${bin.code} can only hold ${bin.maxQty} but this putaway would bring it to ${newQty} (already has ${bin.currentQty}, adding ${item.qty}). Split this item across multiple bins or choose a bin with more capacity.`);
            }
            bins.set(item.binId, { currentQty: newQty, maxQty: bin.maxQty, code: bin.code });
        }
        for (const item of putaway.items) {
            const bin = await this.prisma.warehouseBin.findUnique({ where: { id: item.binId } });
            if (!bin)
                continue;
            const newQty = bin.currentQty + item.qty;
            let newStatus = 'PARTIAL';
            if (bin.maxQty && newQty >= bin.maxQty)
                newStatus = 'FULL';
            await this.prisma.warehouseBin.update({
                where: { id: item.binId },
                data: { currentQty: newQty, itemCode: item.itemCode, status: newStatus, updatedBy: user.id },
            });
        }
        const updated = await this.prisma.stockPutaway.update({
            where: { id }, data: { status: 'COMPLETED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_putaway', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, inProgress, completed] = await Promise.all([
            this.prisma.stockPutaway.count({ where }),
            this.prisma.stockPutaway.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.stockPutaway.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
        ]);
        const totalQty = await this.prisma.stockPutawayItem.aggregate({
            where: { companyId: where.companyId }, _sum: { qty: true },
        });
        return { total, inProgress, completed, totalQtyPutaway: totalQty._sum.qty || 0 };
    }
};
exports.StockPutawayService = StockPutawayService;
exports.StockPutawayService = StockPutawayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], StockPutawayService);
//# sourceMappingURL=stock-putaway.service.js.map