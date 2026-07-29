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
exports.InventoryValuationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryValuationService = class InventoryValuationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(user, query) {
        var _a;
        const { warehouseId } = query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        const balances = await this.prisma.stockBalance.findMany({
            where,
            include: { warehouse: { select: { name: true, code: true } } },
        });
        const byWarehouse = {};
        let grandTotal = 0;
        let totalItems = 0;
        let zeroStockItems = 0;
        for (const b of balances) {
            const wName = ((_a = b.warehouse) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
            if (!byWarehouse[wName])
                byWarehouse[wName] = { warehouse: wName, items: 0, totalQty: 0, totalValue: 0 };
            const value = b.availableQty * b.unitCost;
            byWarehouse[wName].items += 1;
            byWarehouse[wName].totalQty += b.availableQty;
            byWarehouse[wName].totalValue += value;
            grandTotal += value;
            totalItems += 1;
            if (b.availableQty === 0)
                zeroStockItems += 1;
        }
        return {
            grandTotal,
            totalItems,
            zeroStockItems,
            activeItems: totalItems - zeroStockItems,
            byWarehouse: Object.values(byWarehouse).sort((a, b) => b.totalValue - a.totalValue),
        };
    }
    async getAging(user, query) {
        var _a;
        const { warehouseId } = query;
        const companyId = user.companyId;
        const now = new Date();
        const balances = await this.prisma.stockBalance.findMany({
            where: Object.assign(Object.assign({ companyId }, (warehouseId ? { warehouseId } : {})), { availableQty: { gt: 0 } }),
            include: { warehouse: { select: { name: true } } },
        });
        const result = [];
        for (const b of balances) {
            const lastMovement = await this.prisma.stockLedger.findFirst({
                where: { companyId, itemCode: b.itemCode, warehouseId: b.warehouseId },
                orderBy: { transactionDate: 'desc' },
                select: { transactionDate: true, transactionType: true },
            });
            const lastDate = (lastMovement === null || lastMovement === void 0 ? void 0 : lastMovement.transactionDate) || b.createdAt;
            const daysSinceMovement = Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
            let agingBucket = '0-30 days';
            if (daysSinceMovement > 180)
                agingBucket = '180+ days (Dead Stock)';
            else if (daysSinceMovement > 90)
                agingBucket = '91-180 days';
            else if (daysSinceMovement > 60)
                agingBucket = '61-90 days';
            else if (daysSinceMovement > 30)
                agingBucket = '31-60 days';
            result.push({
                itemCode: b.itemCode, itemName: b.itemName, warehouse: (_a = b.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                availableQty: b.availableQty, unitCost: b.unitCost,
                stockValue: b.availableQty * b.unitCost,
                lastMovementDate: lastDate, daysSinceMovement, agingBucket,
                lastMovementType: lastMovement === null || lastMovement === void 0 ? void 0 : lastMovement.transactionType,
            });
        }
        const buckets = {};
        for (const r of result) {
            if (!buckets[r.agingBucket])
                buckets[r.agingBucket] = { bucket: r.agingBucket, items: 0, totalValue: 0, records: [] };
            buckets[r.agingBucket].items += 1;
            buckets[r.agingBucket].totalValue += r.stockValue;
            buckets[r.agingBucket].records.push(r);
        }
        const bucketOrder = ['0-30 days', '31-60 days', '61-90 days', '91-180 days', '180+ days (Dead Stock)'];
        return {
            data: result.sort((a, b) => b.daysSinceMovement - a.daysSinceMovement),
            buckets: bucketOrder.map(b => buckets[b] || { bucket: b, items: 0, totalValue: 0, records: [] }),
            totalValue: result.reduce((s, r) => s + r.stockValue, 0),
        };
    }
    async getSlowMoving(user, query) {
        var _a;
        const { warehouseId, days = 30 } = query;
        const companyId = user.companyId;
        const cutoffDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
        const balances = await this.prisma.stockBalance.findMany({
            where: Object.assign(Object.assign({ companyId }, (warehouseId ? { warehouseId } : {})), { availableQty: { gt: 0 } }),
            include: { warehouse: { select: { name: true } } },
        });
        const slowMoving = [];
        for (const b of balances) {
            const recentMovement = await this.prisma.stockLedger.findFirst({
                where: { companyId, itemCode: b.itemCode, warehouseId: b.warehouseId, transactionDate: { gte: cutoffDate } },
            });
            if (!recentMovement) {
                slowMoving.push({
                    itemCode: b.itemCode, itemName: b.itemName, warehouse: (_a = b.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                    availableQty: b.availableQty, unitCost: b.unitCost,
                    stockValue: b.availableQty * b.unitCost,
                });
            }
        }
        const totalValue = slowMoving.reduce((s, r) => s + r.stockValue, 0);
        return { data: slowMoving.sort((a, b) => b.stockValue - a.stockValue), totalItems: slowMoving.length, totalValue, days: Number(days) };
    }
    async getFifoValue(user, query) {
        var _a;
        const { warehouseId } = query;
        const companyId = user.companyId;
        const where = { companyId, status: 'ACTIVE', availableQty: { gt: 0 } };
        if (warehouseId)
            where.warehouseId = warehouseId;
        const batches = await this.prisma.stockBatch.findMany({
            where,
            include: { warehouse: { select: { name: true } } },
            orderBy: [{ itemCode: 'asc' }, { receivedDate: 'asc' }],
        });
        const grouped = {};
        for (const b of batches) {
            const key = `${b.itemCode}|${b.warehouseId}`;
            if (!grouped[key]) {
                grouped[key] = { itemCode: b.itemCode, itemName: b.itemName, warehouse: (_a = b.warehouse) === null || _a === void 0 ? void 0 : _a.name, totalQty: 0, fifoValue: 0, avgCost: 0, batches: [] };
            }
            grouped[key].totalQty += b.availableQty;
            grouped[key].fifoValue += b.availableQty * b.unitCost;
            grouped[key].batches.push({ batchNumber: b.batchNumber, qty: b.availableQty, unitCost: b.unitCost, receivedDate: b.receivedDate });
        }
        const data = Object.values(grouped).map((g) => (Object.assign(Object.assign({}, g), { avgCost: g.totalQty > 0 ? g.fifoValue / g.totalQty : 0 })));
        const totalFifoValue = data.reduce((s, d) => s + d.fifoValue, 0);
        return { data, totalFifoValue, totalItems: data.length };
    }
};
exports.InventoryValuationService = InventoryValuationService;
exports.InventoryValuationService = InventoryValuationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryValuationService);
//# sourceMappingURL=inventory-valuation.service.js.map