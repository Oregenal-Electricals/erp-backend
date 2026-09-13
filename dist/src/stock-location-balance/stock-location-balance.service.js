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
exports.StockLocationBalanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StockLocationBalanceService = class StockLocationBalanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async adjustQty(params) {
        var _a;
        const { companyId, itemCode, itemName, warehouseId, binId, userId } = params;
        const batchId = (_a = params.batchId) !== null && _a !== void 0 ? _a : null;
        const status = params.status || 'AVAILABLE';
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const existing = await this.prisma.stockLocationBalance.findFirst({
                where: { companyId, itemCode, binId, batchId, status },
            });
            if (!existing) {
                if (params.deltaQty < 0) {
                    throw new common_1.BadRequestException(`No stock of ${itemCode} found in this bin to move/decrement.`);
                }
                try {
                    const created = await this.prisma.stockLocationBalance.create({
                        data: {
                            companyId, itemCode, itemName, warehouseId, binId, batchId, status,
                            qty: params.deltaQty, createdBy: userId, updatedBy: userId,
                        },
                    });
                    return created.qty;
                }
                catch (e) {
                    continue;
                }
            }
            const newQty = existing.qty + params.deltaQty;
            if (newQty < -0.0001) {
                throw new common_1.BadRequestException(`Cannot reduce ${itemCode} in this bin below zero (has ${existing.qty}, requested change ${params.deltaQty}).`);
            }
            const result = await this.prisma.stockLocationBalance.updateMany({
                where: { id: existing.id, qty: existing.qty },
                data: { qty: Math.max(0, newQty), updatedBy: userId },
            });
            if (result.count === 1)
                return Math.max(0, newQty);
        }
        throw new common_1.BadRequestException('Could not update the bin balance - too many concurrent updates, please retry.');
    }
    async consumeAcrossBins(companyId, itemCode, batchId, qtyNeeded, userId, status = 'AVAILABLE') {
        if (qtyNeeded <= 0)
            return 0;
        const rows = await this.prisma.stockLocationBalance.findMany({
            where: { companyId, itemCode, batchId, status, qty: { gt: 0 } },
            orderBy: { createdAt: 'asc' },
        });
        let remaining = qtyNeeded;
        let consumed = 0;
        for (const row of rows) {
            if (remaining <= 0.0001)
                break;
            const take = Math.min(row.qty, remaining);
            await this.adjustQty({
                companyId, itemCode, itemName: row.itemName, warehouseId: row.warehouseId,
                binId: row.binId, batchId: row.batchId, status, deltaQty: -take, userId,
            });
            remaining -= take;
            consumed += take;
        }
        return consumed;
    }
    async getBalance(companyId, itemCode, binId, batchId, status = 'AVAILABLE') {
        return this.prisma.stockLocationBalance.findFirst({ where: { companyId, itemCode, binId, batchId, status } });
    }
    async getByBin(companyId, binId) {
        return this.prisma.stockLocationBalance.findMany({
            where: { companyId, binId, qty: { gt: 0 } },
            include: { batch: { select: { batchNumber: true, expiryDate: true } } },
            orderBy: { itemCode: 'asc' },
        });
    }
    async getByItem(companyId, itemCode) {
        return this.prisma.stockLocationBalance.findMany({
            where: { companyId, itemCode, qty: { gt: 0 } },
            include: { bin: { select: { code: true, rackId: true } }, batch: { select: { batchNumber: true } } },
            orderBy: [{ warehouseId: 'asc' }, { status: 'asc' }],
        });
    }
};
exports.StockLocationBalanceService = StockLocationBalanceService;
exports.StockLocationBalanceService = StockLocationBalanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockLocationBalanceService);
//# sourceMappingURL=stock-location-balance.service.js.map