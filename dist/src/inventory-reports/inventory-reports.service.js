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
exports.InventoryReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryReportsService = class InventoryReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    dateWhere(fromDate, toDate) {
        if (!fromDate && !toDate)
            return undefined;
        const obj = {};
        if (fromDate)
            obj.gte = new Date(fromDate);
        if (toDate)
            obj.lte = new Date(toDate + 'T23:59:59.999Z');
        return obj;
    }
    async getStockRegister(user, query) {
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
        const data = balances.map(b => {
            var _a;
            return ({
                itemCode: b.itemCode, itemName: b.itemName,
                warehouse: (_a = b.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                availableQty: b.availableQty, reservedQty: b.reservedQty,
                unitCost: b.unitCost, stockValue: b.availableQty * b.unitCost,
            });
        });
        const totalValue = data.reduce((s, d) => s + d.stockValue, 0);
        const totalQty = data.reduce((s, d) => s + d.availableQty, 0);
        return { data, totalItems: data.length, totalValue, totalQty };
    }
    async getGrnRegister(user, query) {
        const { warehouseId, fromDate, toDate, status } = query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (status)
            where.status = status;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const grns = await this.prisma.grnHeader.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: {
                warehouse: { select: { name: true } },
                items: { where: { isActive: true }, select: { itemCode: true, itemName: true, receivedQty: true, acceptedQty: true, rejectedQty: true, unitPrice: true } },
            },
        });
        const data = grns.map((g) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                grnNumber: g.grnNumber, grnType: g.grnType, status: g.status,
                warehouse: (_a = g.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                totalItems: ((_b = g.items) === null || _b === void 0 ? void 0 : _b.length) || 0,
                totalReceivedQty: ((_c = g.items) === null || _c === void 0 ? void 0 : _c.reduce((s, i) => s + i.receivedQty, 0)) || 0,
                totalAcceptedQty: ((_d = g.items) === null || _d === void 0 ? void 0 : _d.reduce((s, i) => s + i.acceptedQty, 0)) || 0,
                totalRejectedQty: ((_e = g.items) === null || _e === void 0 ? void 0 : _e.reduce((s, i) => s + i.rejectedQty, 0)) || 0,
                totalValue: ((_f = g.items) === null || _f === void 0 ? void 0 : _f.reduce((s, i) => s + i.acceptedQty * i.unitPrice, 0)) || 0,
                date: g.createdAt,
            });
        });
        const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
        return { data, totalGrns: data.length, totalValue };
    }
    async getIssueRegister(user, query) {
        const { warehouseId, fromDate, toDate, referenceType } = query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (referenceType)
            where.referenceType = referenceType;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const issues = await this.prisma.stockIssue.findMany({
            where: Object.assign(Object.assign({}, where), { status: 'ISSUED' }), orderBy: { createdAt: 'desc' },
            include: {
                warehouse: { select: { name: true } },
                items: { select: { itemCode: true, itemName: true, issuedQty: true, unitCost: true } },
            },
        });
        const data = issues.map(iss => {
            var _a;
            return ({
                issueNumber: iss.issueNumber, issuedTo: iss.issuedTo,
                referenceType: iss.referenceType, issueMethod: iss.issueMethod,
                warehouse: (_a = iss.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                totalItems: iss.items.length,
                totalQty: iss.items.reduce((s, i) => s + i.issuedQty, 0),
                totalValue: iss.items.reduce((s, i) => s + i.issuedQty * i.unitCost, 0),
                date: iss.createdAt,
            });
        });
        const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
        const totalQty = data.reduce((s, d) => s + d.totalQty, 0);
        return { data, totalIssues: data.length, totalValue, totalQty };
    }
    async getTransferRegister(user, query) {
        const { fromDate, toDate, transferType } = query;
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (transferType)
            where.transferType = transferType;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const transfers = await this.prisma.stockTransfer.findMany({
            where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }), orderBy: { createdAt: 'desc' },
            include: {
                fromWarehouse: { select: { name: true } },
                toWarehouse: { select: { name: true } },
                items: { select: { itemCode: true, itemName: true, qty: true, unitCost: true } },
            },
        });
        const data = transfers.map(t => {
            var _a, _b;
            return ({
                transferNumber: t.transferNumber, transferType: t.transferType,
                fromWarehouse: (_a = t.fromWarehouse) === null || _a === void 0 ? void 0 : _a.name, toWarehouse: (_b = t.toWarehouse) === null || _b === void 0 ? void 0 : _b.name,
                totalItems: t.items.length,
                totalQty: t.items.reduce((s, i) => s + i.qty, 0),
                totalValue: t.items.reduce((s, i) => s + i.qty * i.unitCost, 0),
                date: t.createdAt,
            });
        });
        const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
        return { data, totalTransfers: data.length, totalValue };
    }
    async getAbcAnalysis(user, query) {
        const { warehouseId } = query;
        const companyId = user.companyId;
        const issues = await this.prisma.stockIssueItem.findMany({
            where: { companyId },
        });
        const consumption = {};
        for (const item of issues) {
            if (!consumption[item.itemCode]) {
                consumption[item.itemCode] = { itemCode: item.itemCode, itemName: item.itemName, totalQty: 0, totalValue: 0 };
            }
            consumption[item.itemCode].totalQty += item.issuedQty;
            consumption[item.itemCode].totalValue += item.issuedQty * item.unitCost;
        }
        const balances = await this.prisma.stockBalance.findMany({
            where: Object.assign({ companyId }, (warehouseId ? { warehouseId } : {})),
        });
        for (const b of balances) {
            if (!consumption[b.itemCode]) {
                consumption[b.itemCode] = { itemCode: b.itemCode, itemName: b.itemName, totalQty: 0, totalValue: 0 };
            }
        }
        const sorted = Object.values(consumption).sort((a, b) => b.totalValue - a.totalValue);
        const grandTotal = sorted.reduce((s, i) => s + i.totalValue, 0);
        let cumValue = 0;
        const data = sorted.map((item) => {
            cumValue += item.totalValue;
            const cumPercent = grandTotal > 0 ? (cumValue / grandTotal) * 100 : 0;
            let abc = 'C';
            if (cumPercent <= 70)
                abc = 'A';
            else if (cumPercent <= 90)
                abc = 'B';
            return Object.assign(Object.assign({}, item), { cumPercent: cumPercent.toFixed(1), abc });
        });
        const aItems = data.filter((d) => d.abc === 'A').length;
        const bItems = data.filter((d) => d.abc === 'B').length;
        const cItems = data.filter((d) => d.abc === 'C').length;
        return { data, totalItems: data.length, grandTotal, aItems, bItems, cItems };
    }
};
exports.InventoryReportsService = InventoryReportsService;
exports.InventoryReportsService = InventoryReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryReportsService);
//# sourceMappingURL=inventory-reports.service.js.map