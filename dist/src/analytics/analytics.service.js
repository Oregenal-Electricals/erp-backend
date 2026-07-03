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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPeriodDates(months = 1) {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { from, to, now };
    }
    getMonthLabel(d) {
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    async getExecutiveDashboard(companyId) {
        const { now } = this.getPeriodDates(1);
        const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const [revMTD, revPrev, orderStats, poStats, ncrStats, arStats, apStats, approvalStats, taskStats, lowStock] = await Promise.all([
            this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: mStart, lte: mEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
            this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: prevStart, lte: prevEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
            this.prisma.salesOrder.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
            this.prisma.purchaseOrder.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
            this.prisma.ncrRecord.groupBy({ by: ['status'], where: { companyId, isActive: true }, _count: { id: true } }),
            this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
            this.prisma.apBill.aggregate({ where: { companyId, status: { in: ['APPROVED', 'PARTIAL', 'OVERDUE'] } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
            this.prisma.approvalRequest.count({ where: { companyId, status: 'PENDING' } }),
            this.prisma.task.count({ where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] }, isActive: true } }),
            this.prisma.stockBalance.count({ where: { companyId, availableQty: { lte: 10 } } }),
        ]);
        const revTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const rev = await this.prisma.arInvoice.aggregate({
                where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } },
                _sum: { totalAmount: true },
            });
            revTrend.push({ month: this.getMonthLabel(d), revenue: rev._sum.totalAmount || 0 });
        }
        const soByStatus = {};
        orderStats.forEach(s => { soByStatus[s.status] = s._count.id; });
        const poByStatus = {};
        poStats.forEach(s => { poByStatus[s.status] = s._count.id; });
        const ncrByStatus = {};
        ncrStats.forEach(s => { ncrByStatus[s.status] = s._count.id; });
        const revMTDVal = revMTD._sum.totalAmount || 0;
        const revPrevVal = revPrev._sum.totalAmount || 0;
        const revGrowth = revPrevVal > 0 ? Math.round((revMTDVal - revPrevVal) / revPrevVal * 100 * 10) / 10 : 0;
        const topCustomers = await this.prisma.arInvoice.groupBy({
            by: ['customerName'],
            where: { companyId, status: { notIn: ['CANCELLED'] } },
            _sum: { totalAmount: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 5,
        });
        const recentOrders = await this.prisma.salesOrder.findMany({
            where: { companyId, isActive: true },
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { soNumber: true, customerName: true, totalAmount: true, status: true, createdAt: true },
        });
        return {
            kpis: {
                revenueMTD: revMTDVal, revenuePrev: revPrevVal, revenueGrowth: revGrowth,
                arOutstanding: arStats._sum.outstandingAmount || 0, arCount: arStats._count.id,
                apOutstanding: apStats._sum.outstandingAmount || 0, apCount: apStats._count.id,
                pendingApprovals: approvalStats, openTasks: taskStats, lowStockItems: lowStock,
            },
            orderPipeline: soByStatus,
            purchasePipeline: poByStatus,
            ncrSummary: ncrByStatus,
            revenueTrend: revTrend,
            topCustomers: topCustomers.map(c => ({ name: c.customerName, revenue: c._sum.totalAmount || 0 })),
            recentOrders,
        };
    }
    async getSalesAnalytics(companyId) {
        const now = new Date();
        const salesTrend = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const [rev, orders] = await Promise.all([
                this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
                this.prisma.salesOrder.count({ where: { companyId, createdAt: { gte: d, lte: dEnd } } }),
            ]);
            salesTrend.push({ month: this.getMonthLabel(d), revenue: rev._sum.totalAmount || 0, orders });
        }
        const topCustomers = await this.prisma.arInvoice.groupBy({
            by: ['customerName'], where: { companyId, status: { notIn: ['CANCELLED'] } },
            _sum: { totalAmount: true }, _count: { id: true },
            orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
        });
        const soStatus = await this.prisma.salesOrder.groupBy({
            by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
        });
        const dispatched = await this.prisma.dispatch.count({ where: { companyId, isActive: true } });
        const delivered = await this.prisma.dispatch.count({ where: { companyId, isActive: true, status: 'DELIVERED' } });
        return {
            salesTrend,
            topCustomers: topCustomers.map(c => ({ name: c.customerName, revenue: c._sum.totalAmount || 0, invoices: c._count.id })),
            soByStatus: soStatus.reduce((a, s) => (Object.assign(Object.assign({}, a), { [s.status]: s._count.id })), {}),
            dispatchRate: dispatched > 0 ? Math.round(delivered / dispatched * 100) : 0,
            totalDispatched: dispatched, totalDelivered: delivered,
        };
    }
    async getPurchaseAnalytics(companyId) {
        const now = new Date();
        const purchaseTrend = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const spend = await this.prisma.purchaseOrder.aggregate({
                where: { companyId, poDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } },
                _sum: { totalAmount: true },
            });
            purchaseTrend.push({ month: this.getMonthLabel(d), spend: spend._sum.totalAmount || 0 });
        }
        const topVendors = await this.prisma.purchaseOrder.groupBy({
            by: ['vendorId'], where: { companyId, status: { notIn: ['CANCELLED'] } },
            _sum: { totalAmount: true }, _count: { id: true },
            orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
        });
        const vendorIds = topVendors.map(v => v.vendorId);
        const vendors = await this.prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
        const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
        const poStatus = await this.prisma.purchaseOrder.groupBy({
            by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
        });
        return {
            purchaseTrend,
            topVendors: topVendors.map(v => ({ name: vendorMap[v.vendorId] || v.vendorId, spend: v._sum.totalAmount || 0, pos: v._count.id })),
            poByStatus: poStatus.reduce((a, s) => (Object.assign(Object.assign({}, a), { [s.status]: s._count.id })), {}),
        };
    }
    async getInventoryAnalytics(companyId) {
        const stockSummary = await this.prisma.stockBalance.aggregate({
            where: { companyId, isActive: true },
            _sum: { availableQty: true, totalValue: true },
            _count: { id: true },
        });
        const lowStock = await this.prisma.stockBalance.findMany({
            where: { companyId, availableQty: { lte: 10 }, isActive: true },
            include: { warehouse: { select: { name: true } } },
            orderBy: { availableQty: 'asc' }, take: 20,
        });
        const byWarehouse = await this.prisma.stockBalance.groupBy({
            by: ['warehouseId'], where: { companyId, isActive: true },
            _sum: { totalValue: true, availableQty: true }, _count: { id: true },
        });
        const warehouseIds = byWarehouse.map(w => w.warehouseId);
        const warehouses = await this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } }, select: { id: true, name: true } });
        const wMap = Object.fromEntries(warehouses.map(w => [w.id, w.name]));
        const zeroStock = await this.prisma.stockBalance.count({ where: { companyId, availableQty: { lte: 0 } } });
        return {
            totalItems: stockSummary._count.id,
            totalQty: stockSummary._sum.availableQty || 0,
            totalValue: stockSummary._sum.totalValue || 0,
            lowStockCount: lowStock.length,
            zeroStockCount: zeroStock,
            lowStockItems: lowStock.map(s => { var _a; return ({ itemCode: s.itemCode, itemName: s.itemName, availableQty: s.availableQty, warehouse: ((_a = s.warehouse) === null || _a === void 0 ? void 0 : _a.name) || '—' }); }),
            byWarehouse: byWarehouse.map(w => ({ warehouse: wMap[w.warehouseId] || w.warehouseId, value: w._sum.totalValue || 0, qty: w._sum.availableQty || 0, items: w._count.id })),
        };
    }
    async getQualityAnalytics(companyId) {
        const now = new Date();
        const ncrTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const count = await this.prisma.ncrRecord.count({ where: { companyId, createdAt: { gte: d, lte: dEnd } } });
            ncrTrend.push({ month: this.getMonthLabel(d), ncrs: count });
        }
        const ncrBySource = await this.prisma.ncrRecord.groupBy({
            by: ['source'], where: { companyId, isActive: true }, _count: { id: true },
        });
        const ncrBySeverity = await this.prisma.ncrRecord.groupBy({
            by: ['severity'], where: { companyId, isActive: true }, _count: { id: true },
        });
        const ncrByStatus = await this.prisma.ncrRecord.groupBy({
            by: ['status'], where: { companyId, isActive: true }, _count: { id: true },
        });
        const [capaOpen, capaClosed, capaOverdue] = await Promise.all([
            this.prisma.capaRecord.count({ where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            this.prisma.capaRecord.count({ where: { companyId, status: 'CLOSED' } }),
            this.prisma.capaRecord.count({ where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: now } } }),
        ]);
        return {
            ncrTrend,
            ncrBySource: ncrBySource.reduce((a, s) => (Object.assign(Object.assign({}, a), { [s.source]: s._count.id })), {}),
            ncrBySeverity: ncrBySeverity.reduce((a, s) => (Object.assign(Object.assign({}, a), { [s.severity]: s._count.id })), {}),
            ncrByStatus: ncrByStatus.reduce((a, s) => (Object.assign(Object.assign({}, a), { [s.status]: s._count.id })), {}),
            capa: { open: capaOpen, closed: capaClosed, overdue: capaOverdue },
        };
    }
    async getFinanceAnalytics(companyId) {
        const now = new Date();
        const plTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const [rev, spend] = await Promise.all([
                this.prisma.arInvoice.aggregate({ where: { companyId, invoiceDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
                this.prisma.apBill.aggregate({ where: { companyId, billDate: { gte: d, lte: dEnd }, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } }),
            ]);
            const revenue = rev._sum.totalAmount || 0;
            const expense = spend._sum.totalAmount || 0;
            plTrend.push({ month: this.getMonthLabel(d), revenue, expense, profit: revenue - expense });
        }
        const arBuckets = await Promise.all([
            this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, dueDate: { gte: now } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
            this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: now, gte: new Date(now.getTime() - 30 * 86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
            this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: new Date(now.getTime() - 30 * 86400000), gte: new Date(now.getTime() - 60 * 86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
            this.prisma.arInvoice.aggregate({ where: { companyId, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: new Date(now.getTime() - 60 * 86400000) } }, _sum: { outstandingAmount: true }, _count: { id: true } }),
        ]);
        return {
            plTrend,
            arAging: [
                { bucket: 'Current', amount: arBuckets[0]._sum.outstandingAmount || 0, count: arBuckets[0]._count.id },
                { bucket: '1-30 days', amount: arBuckets[1]._sum.outstandingAmount || 0, count: arBuckets[1]._count.id },
                { bucket: '31-60 days', amount: arBuckets[2]._sum.outstandingAmount || 0, count: arBuckets[2]._count.id },
                { bucket: '60+ days', amount: arBuckets[3]._sum.outstandingAmount || 0, count: arBuckets[3]._count.id },
            ],
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map