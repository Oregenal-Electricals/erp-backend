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
exports.StockReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StockReportsService = class StockReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLedger(user, query) {
        const { warehouseId, itemCode, transactionType, fromDate, toDate, page = 1, limit = 50 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (itemCode)
            where.itemCode = { contains: itemCode, mode: 'insensitive' };
        if (transactionType)
            where.transactionType = transactionType;
        if (fromDate || toDate) {
            where.transactionDate = {};
            if (fromDate)
                where.transactionDate.gte = new Date(fromDate);
            if (toDate)
                where.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
        }
        const [data, total] = await Promise.all([
            this.prisma.stockLedger.findMany({
                where, skip, take: Number(limit),
                orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
                include: { warehouse: { select: { name: true, code: true } } },
            }),
            this.prisma.stockLedger.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getBalanceSummary(user, query) {
        const { warehouseId, search } = query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (search)
            where.OR = [
                { itemCode: { contains: search, mode: 'insensitive' } },
                { itemName: { contains: search, mode: 'insensitive' } },
            ];
        const balances = await this.prisma.stockBalance.findMany({
            where,
            include: { warehouse: { select: { name: true, code: true } } },
            orderBy: [{ itemCode: 'asc' }],
        });
        const totalValue = balances.reduce((sum, b) => sum + (b.availableQty * b.unitCost), 0);
        const totalItems = balances.length;
        const lowStockItems = balances.filter(b => b.availableQty <= 10).length;
        return { data: balances, totalItems, totalValue, lowStockItems };
    }
    async getItemCard(itemCode, user, query) {
        const { warehouseId, fromDate, toDate } = query;
        const companyId = user.companyId;
        const balanceWhere = { companyId, itemCode };
        if (warehouseId)
            balanceWhere.warehouseId = warehouseId;
        const balances = await this.prisma.stockBalance.findMany({
            where: balanceWhere,
            include: { warehouse: { select: { name: true } } },
        });
        const ledgerWhere = { companyId, itemCode };
        if (warehouseId)
            ledgerWhere.warehouseId = warehouseId;
        if (fromDate || toDate) {
            ledgerWhere.transactionDate = {};
            if (fromDate)
                ledgerWhere.transactionDate.gte = new Date(fromDate);
            if (toDate)
                ledgerWhere.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
        }
        const movements = await this.prisma.stockLedger.findMany({
            where: ledgerWhere,
            orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
            include: { warehouse: { select: { name: true } } },
        });
        const batches = await this.prisma.stockBatch.findMany({
            where: { companyId, itemCode, status: 'ACTIVE' },
            orderBy: { receivedDate: 'asc' },
            include: { warehouse: { select: { name: true } } },
        });
        let runningQty = 0;
        const ledgerWithBalance = movements.map(m => {
            runningQty += (m.inQty - m.outQty);
            return Object.assign(Object.assign({}, m), { runningBalance: runningQty });
        });
        const totalIn = movements.reduce((s, m) => s + m.inQty, 0);
        const totalOut = movements.reduce((s, m) => s + m.outQty, 0);
        return {
            itemCode, balances, movements: ledgerWithBalance, batches,
            summary: { totalIn, totalOut, netMovement: totalIn - totalOut, currentBalance: balances.reduce((s, b) => s + b.availableQty, 0) },
        };
    }
    async getBatchMovements(user, query) {
        const { warehouseId, itemCode, status, page = 1, limit = 30 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (itemCode)
            where.itemCode = { contains: itemCode, mode: 'insensitive' };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.stockBatch.findMany({
                where, skip, take: Number(limit),
                orderBy: [{ receivedDate: 'asc' }],
                include: { warehouse: { select: { name: true } } },
            }),
            this.prisma.stockBatch.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getConsumptionReport(user, query) {
        const { warehouseId, fromDate, toDate } = query;
        const where = { transactionType: 'ISSUE' };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (fromDate || toDate) {
            where.transactionDate = {};
            if (fromDate)
                where.transactionDate.gte = new Date(fromDate);
            if (toDate)
                where.transactionDate.lte = new Date(toDate + 'T23:59:59.999Z');
        }
        const movements = await this.prisma.stockLedger.findMany({ where, orderBy: { itemCode: 'asc' } });
        const grouped = {};
        for (const m of movements) {
            if (!grouped[m.itemCode]) {
                grouped[m.itemCode] = { itemCode: m.itemCode, itemName: m.itemName, totalQty: 0, totalValue: 0, transactions: 0 };
            }
            grouped[m.itemCode].totalQty += m.outQty;
            grouped[m.itemCode].totalValue += m.outQty * m.unitCost;
            grouped[m.itemCode].transactions += 1;
        }
        const data = Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
        const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
        return { data, totalValue, totalItems: data.length };
    }
};
exports.StockReportsService = StockReportsService;
exports.StockReportsService = StockReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockReportsService);
//# sourceMappingURL=stock-reports.service.js.map