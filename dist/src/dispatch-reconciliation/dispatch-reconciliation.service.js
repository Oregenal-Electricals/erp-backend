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
exports.DispatchReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DispatchReconciliationService = class DispatchReconciliationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    netItem(i) {
        var _a, _b, _c;
        const packed = (_c = (_b = (_a = i.packedQty) !== null && _a !== void 0 ? _a : i.pickedQty) !== null && _b !== void 0 ? _b : i.verifiedQty) !== null && _c !== void 0 ? _c : 0;
        return packed - (i.reversedQty || 0);
    }
    async reconcilePlan(planId, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({
            where: { id: planId, companyId: user.companyId },
            include: { items: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch Plan not found');
        const plannedQty = plan.items.reduce((s, i) => s + i.plannedQty, 0);
        const reservations = await this.prisma.dispatchReservation.findMany({ where: { dispatchPlanId: planId, status: { not: 'CANCELLED' } } });
        const reservedQty = reservations.reduce((s, r) => s + r.reservedQty, 0);
        const pickLists = await this.prisma.pickList.findMany({ where: { dispatchPlanId: planId }, include: { items: true } });
        const pickedQty = pickLists.flatMap((p) => p.items).reduce((s, i) => s + this.netItem(i), 0);
        const verifications = await this.prisma.dispatchVerification.findMany({ where: { pickList: { dispatchPlanId: planId } }, include: { items: true } });
        const verifiedQty = verifications.flatMap((v) => v.items).reduce((s, i) => s + this.netItem(i), 0);
        const verificationExceptions = verifications.flatMap((v) => v.items).filter((i) => i.status === 'EXCEPTION');
        const packages = await this.prisma.dispatchPackage.findMany({
            where: { packing: { verification: { pickList: { dispatchPlanId: planId } } } },
            include: { items: true },
        });
        let packedQty = 0, loadedQty = 0, confirmedQty = 0, gatedOutQty = 0;
        for (const pkg of packages) {
            const net = pkg.items.reduce((s, i) => s + this.netItem(i), 0);
            if (pkg.status !== 'REVERSED')
                packedQty += net;
            if (pkg.loadedInLoadingId || pkg.gateOutId)
                loadedQty += net;
            if (pkg.confirmedInConfirmationId || pkg.gateOutId)
                confirmedQty += net;
            if (pkg.gateOutId)
                gatedOutQty += net;
        }
        const loadingExceptions = await this.prisma.dispatchLoadingItem.findMany({ where: { loading: { dispatchPlanId: planId }, status: 'EXCEPTION' } });
        const confirmationExceptions = await this.prisma.dispatchConfirmationItem.findMany({ where: { confirmation: { dispatchPlanId: planId }, status: 'EXCEPTION' } });
        const explanations = [];
        if (verificationExceptions.length)
            explanations.push(`${verificationExceptions.length} item(s) blocked at verification (quality/stage exception)`);
        if (loadingExceptions.length)
            explanations.push(`${loadingExceptions.length} item(s) blocked at loading (quality/stage exception)`);
        if (confirmationExceptions.length)
            explanations.push(`${confirmationExceptions.length} item(s) blocked at confirmation (quality/document exception)`);
        const steps = [
            { stage: 'PLANNED', qty: plannedQty },
            { stage: 'RESERVED', qty: reservedQty },
            { stage: 'PICKED', qty: pickedQty },
            { stage: 'VERIFIED', qty: verifiedQty },
            { stage: 'PACKED', qty: packedQty },
            { stage: 'LOADED', qty: loadedQty },
            { stage: 'CONFIRMED_FOR_GATE_OUT', qty: confirmedQty },
            { stage: 'GATED_OUT', qty: gatedOutQty },
        ];
        const hasUnexplainedVariance = plannedQty - gatedOutQty > 0 && explanations.length === 0 && (pickLists.length > 0 || packages.length > 0);
        return {
            dispatchPlanId: planId, planNumber: plan.planNumber, status: plan.status,
            quantityChain: steps,
            explanations,
            reconciliationStatus: hasUnexplainedVariance ? 'RECONCILIATION_EXCEPTION' : (gatedOutQty >= plannedQty ? 'FULLY_RECONCILED' : 'IN_PROGRESS'),
        };
    }
    async reconcileSalesOrder(soId, user) {
        const so = await this.prisma.salesOrder.findFirst({ where: { id: soId, companyId: user.companyId }, include: { items: true } });
        if (!so)
            throw new common_1.NotFoundException('Sales Order not found');
        const lines = await Promise.all(so.items.map(async (item) => {
            const gateOutItems = await this.prisma.dispatchGateOutItem.findMany({ where: { soItemId: item.id, isActive: true } });
            const actualGateOutQty = gateOutItems.reduce((s, i) => s + i.qty, 0);
            return {
                soItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, saleType: item.saleType,
                orderedQty: item.qty, actualDispatchedQty: item.dispatchedQty, actualGateOutQty,
                remainingQty: item.pendingQty,
                consistent: Math.abs(actualGateOutQty - item.dispatchedQty) < 0.001,
            };
        }));
        const allFull = lines.every((l) => l.remainingQty <= 0);
        return {
            soId, soNumber: so.soNumber, customerName: so.customerName, status: so.status,
            fulfilmentStatus: allFull ? 'FULLY_DISPATCHED' : lines.some((l) => l.actualDispatchedQty > 0) ? 'PARTIALLY_DISPATCHED' : 'OPEN',
            lines,
        };
    }
    async reconcileSfgStage(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work Order not found');
        const gateOutItems = await this.prisma.dispatchGateOutItem.findMany({ where: { workOrderId, isActive: true } });
        const dispatchedAsSfg = gateOutItems.reduce((s, i) => s + i.qty, 0);
        const acceptedOutput = wo.completedQty;
        const transferred = wo.cumulativeHandoverQty;
        const activeReserved = wo.dispatchReservedQty;
        const remainingWip = acceptedOutput - transferred - dispatchedAsSfg - activeReserved;
        const accountedTotal = transferred + dispatchedAsSfg + activeReserved + Math.max(0, remainingWip);
        let reconciliationResult = 'PASS';
        let varianceQty = 0;
        if (remainingWip < -0.001) {
            reconciliationResult = 'EXCESS_ERROR';
            varianceQty = Math.abs(remainingWip);
        }
        else if (accountedTotal < acceptedOutput - 0.001) {
            reconciliationResult = 'UNACCOUNTED';
            varianceQty = acceptedOutput - accountedTotal;
        }
        return {
            workOrderId, stageName: wo.stageName, itemCode: wo.productCode,
            acceptedOutput, transferredToNextStage: transferred, dispatchedAsSfg, activeDispatchReserved: activeReserved,
            remainingWip: Math.max(0, remainingWip), reconciliationResult, varianceQty,
        };
    }
    async checkCriticalConsistency(gateOutId, user) {
        const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { id: gateOutId, companyId: user.companyId }, include: { items: true, dispatchConfirmation: true } });
        if (!gateOut)
            throw new common_1.NotFoundException('Gate-Out not found');
        const issues = [];
        for (const item of gateOut.items) {
            const soItem = await this.prisma.salesOrderItem.findUnique({ where: { id: item.soItemId } });
            if (!soItem || soItem.dispatchedQty < item.qty - 0.001) {
                issues.push(`Gate-Out item for ${item.itemCode} (qty ${item.qty}) has no matching Sales dispatched quantity update`);
            }
            if (item.dispatchReservationId) {
                const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: item.dispatchReservationId } });
                if (reservation && reservation.status === 'ACTIVE') {
                    issues.push(`Reservation ${reservation.reservationNumber} for ${item.itemCode} is still ACTIVE despite a completed Gate-Out - should be FULFILLED or PARTIALLY_RELEASED`);
                }
            }
        }
        if (gateOut.dispatchConfirmation.status !== 'GATED_OUT') {
            issues.push(`Dispatch Confirmation ${gateOut.dispatchConfirmationId} is not marked GATED_OUT despite a completed Gate-Out`);
        }
        return { gateOutId, gateOutNumber: gateOut.gateOutNumber, consistent: issues.length === 0, issues };
    }
};
exports.DispatchReconciliationService = DispatchReconciliationService;
exports.DispatchReconciliationService = DispatchReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DispatchReconciliationService);
//# sourceMappingURL=dispatch-reconciliation.service.js.map