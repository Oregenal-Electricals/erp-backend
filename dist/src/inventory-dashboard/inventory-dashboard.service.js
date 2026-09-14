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
exports.InventoryDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryDashboardService = class InventoryDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(user) {
        const companyId = user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalItems, totalWarehouses, totalBatches, pendingGrns, pendingIqc, pendingPutaway, todayReceipts, todayIssues, todayTransfers, balances,] = await Promise.all([
            this.prisma.stockBalance.count({ where: { companyId, availableQty: { gt: 0 } } }),
            this.prisma.warehouse.count({ where: { companyId, isActive: true } }),
            this.prisma.stockBatch.count({ where: { companyId, status: 'ACTIVE' } }),
            this.prisma.grnHeader.count({ where: { companyId, status: { in: ['DRAFT', 'SUBMITTED'] } } }),
            this.prisma.iqcInspection.count({ where: { companyId, status: 'PENDING' } }),
            this.prisma.stockPutaway.count({ where: { companyId, status: 'IN_PROGRESS' } }),
            this.prisma.stockLedger.count({ where: { companyId, transactionType: 'IQC_ACCEPT', transactionDate: { gte: today } } }),
            this.prisma.stockLedger.count({ where: { companyId, transactionType: 'ISSUE', transactionDate: { gte: today } } }),
            this.prisma.stockLedger.count({ where: { companyId, transactionType: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] }, transactionDate: { gte: today } } }),
            this.prisma.stockBalance.findMany({ where: { companyId }, select: { availableQty: true, unitCost: true } }),
        ]);
        const totalStockValue = balances.reduce((s, b) => s + b.availableQty * b.unitCost, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const [monthReceipts, monthIssues] = await Promise.all([
            this.prisma.stockLedger.aggregate({ where: { companyId, transactionType: 'IQC_ACCEPT', transactionDate: { gte: monthStart } }, _sum: { inQty: true } }),
            this.prisma.stockLedger.aggregate({ where: { companyId, transactionType: 'ISSUE', transactionDate: { gte: monthStart } }, _sum: { outQty: true } }),
        ]);
        return {
            totalItems, totalWarehouses, totalBatches, totalStockValue,
            pendingGrns, pendingIqc, pendingPutaway,
            today: { receipts: todayReceipts, issues: todayIssues, transfers: Math.floor(todayTransfers / 2) },
            month: { receipts: monthReceipts._sum.inQty || 0, issues: monthIssues._sum.outQty || 0 },
        };
    }
    async getAlerts(user) {
        const companyId = user.companyId;
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const [lowStock, expiringBatches, expiredBatches, pendingGrns, pendingIqc, quarantinedBatches] = await Promise.all([
            this.prisma.stockBalance.findMany({
                where: { companyId, availableQty: { gt: 0, lte: 10 } },
                select: { itemCode: true, itemName: true, availableQty: true },
                orderBy: { availableQty: 'asc' }, take: 10,
            }),
            this.prisma.stockBatch.findMany({
                where: { companyId, status: 'ACTIVE', expiryDate: { lte: in30Days, gte: now } },
                select: { batchNumber: true, itemCode: true, itemName: true, expiryDate: true, availableQty: true },
                orderBy: { expiryDate: 'asc' }, take: 10,
            }),
            this.prisma.stockBatch.count({ where: { companyId, status: 'EXPIRED' } }),
            this.prisma.grnHeader.findMany({
                where: { companyId, status: { in: ['DRAFT', 'SUBMITTED'] } },
                select: { grnNumber: true, status: true, createdAt: true },
                orderBy: { createdAt: 'desc' }, take: 5,
            }),
            this.prisma.iqcInspection.findMany({
                where: { companyId, status: 'PENDING' },
                select: { iqcNumber: true, createdAt: true },
                orderBy: { createdAt: 'desc' }, take: 5,
            }),
            this.prisma.stockBatch.count({ where: { companyId, status: 'QUARANTINED' } }),
        ]);
        return { lowStock, expiringBatches, expiredBatches, pendingGrns, pendingIqc, quarantinedBatches };
    }
    async getActivity(user) {
        const companyId = user.companyId;
        const movements = await this.prisma.stockLedger.findMany({
            where: { companyId },
            orderBy: { transactionDate: 'desc' },
            take: 15,
            include: { warehouse: { select: { name: true } } },
        });
        return movements;
    }
    async getTopItems(user) {
        const companyId = user.companyId;
        const balances = await this.prisma.stockBalance.findMany({
            where: { companyId, availableQty: { gt: 0 } },
            include: { warehouse: { select: { name: true } } },
        });
        const sorted = balances
            .map(b => (Object.assign(Object.assign({}, b), { stockValue: b.availableQty * b.unitCost })))
            .sort((a, b) => b.stockValue - a.stockValue)
            .slice(0, 10);
        const totalValue = sorted.reduce((s, b) => s + b.stockValue, 0);
        return { data: sorted, totalValue };
    }
    async getActionCards(user) {
        const companyId = user.companyId;
        const [waitingFromGate, physicalVerificationPending, iqcPending, iqcPassedPutAwayPending, iqcFailedRejectedPlacementPending, holdMaterial, woWaitingForMaterial, additionalMaterialApprovalPending, stockCountVariancePending, rtvApprovalPending, rtvGateOutPending, previousMaterialOverridePending,] = await Promise.all([
            this.prisma.gateInwardEntry.count({ where: { companyId, status: 'PENDING' } }).catch(() => 0),
            this.prisma.storeReceiving.count({ where: { companyId, status: { in: ['DRAFT', 'PENDING'] } } }).catch(() => 0),
            this.prisma.iqcInspection.count({ where: { companyId, status: 'PENDING' } }),
            this.prisma.stockPutaway.count({ where: { companyId, status: 'IN_PROGRESS' } }),
            this.prisma.rejectedStockItem.count({ where: { rejectedStock: { companyId }, disposition: 'PENDING', isActive: true } }),
            this.prisma.holdStockItem.count({ where: { holdStock: { companyId }, reinspectionStatus: 'PENDING', isActive: true } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'IN_PROGRESS', materialAvailability: { not: 'AVAILABLE' } } }),
            this.prisma.additionalMaterialRequest.count({ where: { companyId, status: 'PENDING', isActive: true } }),
            this.prisma.stockAdjustment.count({ where: { companyId, status: 'DRAFT' } }),
            this.prisma.rtvRequest.count({ where: { companyId, status: 'DRAFT', isActive: true } }),
            this.prisma.rtvRequest.count({ where: { companyId, status: { in: ['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'] }, isActive: true } }),
            this.prisma.materialIssueOverride.count({ where: { companyId, status: 'PENDING' } }),
        ]);
        const reservedBalances = await this.prisma.stockBalance.findMany({
            where: { companyId, reservedQty: { gt: 0 } },
            select: { reservedQty: true, availableQty: true },
        });
        const reservationShortfallCount = reservedBalances.filter(b => b.reservedQty > b.availableQty + 0.0001).length;
        return {
            waitingFromGate,
            physicalVerificationPending,
            iqcPending,
            iqcPassedPutAwayPending,
            iqcFailedRejectedPlacementPending,
            holdMaterial,
            woWaitingForMaterial,
            previousMaterialOverridePending,
            additionalMaterialApprovalPending,
            productionReturnsPending: { notApplicable: true, reason: 'Production returns in this system (STORE-014) post immediately once Store verifies condition - there is no separate pending-approval queue for them.' },
            stockCountVariancePending,
            rtvApprovalPending,
            rtvGateOutPending,
            reservationShortfall: reservationShortfallCount,
        };
    }
    async getReconciliation(user) {
        var _a, _b;
        const companyId = user.companyId;
        const issues = [];
        const negativeStock = await this.prisma.stockBalance.findMany({
            where: { companyId, availableQty: { lt: 0 } },
            select: { itemCode: true, warehouseId: true, availableQty: true },
        });
        for (const b of negativeStock) {
            issues.push({ severity: 'CRITICAL', check: 'NEGATIVE_STOCK', itemCode: b.itemCode, warehouseId: b.warehouseId, expected: 0, actual: b.availableQty, difference: b.availableQty });
        }
        const reservedBalances = await this.prisma.stockBalance.findMany({
            where: { companyId, reservedQty: { gt: 0 } },
            select: { itemCode: true, warehouseId: true, reservedQty: true, availableQty: true },
        });
        for (const b of reservedBalances) {
            if (b.reservedQty > b.availableQty + 0.0001) {
                issues.push({ severity: 'CRITICAL', check: 'RESERVATION_SHORTFALL', itemCode: b.itemCode, warehouseId: b.warehouseId, expected: `<= ${b.availableQty}`, actual: b.reservedQty, difference: b.reservedQty - b.availableQty, recommendedAction: 'Review and reallocate or release the affected reservations - do not post any stock-reducing transaction for this item until resolved.' });
            }
        }
        const negativeBatches = await this.prisma.stockBatch.findMany({
            where: { companyId, availableQty: { lt: 0 } },
            select: { batchNumber: true, itemCode: true, availableQty: true },
        });
        for (const bt of negativeBatches) {
            issues.push({ severity: 'CRITICAL', check: 'NEGATIVE_BATCH', itemCode: bt.itemCode, batch: bt.batchNumber, expected: 0, actual: bt.availableQty, difference: bt.availableQty });
        }
        const badRtvs = await this.prisma.rtvRequest.findMany({
            where: { companyId, isActive: true },
            select: { rtvNumber: true, itemCode: true, preparedQty: true, gateOutQty: true, approvedQty: true, requestedQty: true },
        });
        for (const r of badRtvs) {
            if (r.gateOutQty > r.preparedQty + 0.0001) {
                issues.push({ severity: 'CRITICAL', check: 'RTV_GATEOUT_EXCEEDS_PREPARED', itemCode: r.itemCode, reference: r.rtvNumber, expected: `<= ${r.preparedQty}`, actual: r.gateOutQty, difference: r.gateOutQty - r.preparedQty });
            }
            if (r.approvedQty != null && r.approvedQty > r.requestedQty + 0.0001) {
                issues.push({ severity: 'AMBER', check: 'RTV_APPROVED_EXCEEDS_REQUESTED', itemCode: r.itemCode, reference: r.rtvNumber, expected: `<= ${r.requestedQty}`, actual: r.approvedQty, difference: r.approvedQty - r.requestedQty });
            }
        }
        const orphanReservations = await this.prisma.materialReservation.findMany({
            where: { status: 'ACTIVE', workOrder: { companyId, status: { in: ['CANCELLED', 'COMPLETED'] } } },
            select: { id: true, itemCode: true, reservedQty: true, workOrderId: true, workOrder: { select: { woNumber: true, status: true } } },
        }).catch(() => []);
        for (const res of orphanReservations) {
            if (res.reservedQty > 0.0001) {
                issues.push({ severity: 'AMBER', check: 'ORPHAN_RESERVATION', itemCode: res.itemCode, reference: (_a = res.workOrder) === null || _a === void 0 ? void 0 : _a.woNumber, expected: 0, actual: res.reservedQty, difference: res.reservedQty, recommendedAction: `Work order is ${(_b = res.workOrder) === null || _b === void 0 ? void 0 : _b.status} but still holds an ACTIVE reservation - review and release.` });
            }
        }
        const critical = issues.filter(i => i.severity === 'CRITICAL').length;
        const amber = issues.filter(i => i.severity === 'AMBER').length;
        const health = critical > 0 ? 'RED' : (amber > 0 ? 'AMBER' : 'GREEN');
        return { health, criticalCount: critical, amberCount: amber, issues };
    }
};
exports.InventoryDashboardService = InventoryDashboardService;
exports.InventoryDashboardService = InventoryDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryDashboardService);
//# sourceMappingURL=inventory-dashboard.service.js.map