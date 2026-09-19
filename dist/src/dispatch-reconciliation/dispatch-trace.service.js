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
exports.DispatchTraceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DispatchTraceService = class DispatchTraceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async tracePackage(packageId, user) {
        const pkg = await this.prisma.dispatchPackage.findFirst({
            where: { id: packageId, isActive: true },
            include: {
                items: true,
                packing: { include: { verification: { include: { pickList: { include: { dispatchPlan: { include: { salesOrder: true } } } } } } } },
                assignedTransportAssignment: true,
                loadedInLoading: true,
                confirmedInConfirmation: true,
                gateOut: true,
            },
        });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found');
        if (pkg.packing.verification.pickList.dispatchPlan.salesOrder.companyId !== user.companyId)
            throw new common_1.NotFoundException('Package not found');
        const plan = pkg.packing.verification.pickList.dispatchPlan;
        const so = plan.salesOrder;
        const timeline = [
            { stage: 'SALES_ORDER', ref: so.soNumber, at: so.createdAt },
            { stage: 'DISPATCH_PLAN', ref: plan.planNumber, at: plan.createdAt },
            { stage: 'PICK_LIST', ref: pkg.packing.verification.pickList.pickListNumber, at: pkg.packing.verification.pickList.createdAt },
            { stage: 'VERIFICATION', ref: pkg.packing.verification.verificationNumber, at: pkg.packing.verification.createdAt },
            { stage: 'PACKING', ref: pkg.packing.packingNumber, packageNumber: pkg.packageNumber, at: pkg.createdAt },
        ];
        if (pkg.assignedTransportAssignment)
            timeline.push({ stage: 'TRANSPORT_ASSIGNMENT', ref: pkg.assignedTransportAssignment.assignmentNumber, vehicleNumber: pkg.assignedTransportAssignment.vehicleNumber, at: pkg.assignedTransportAssignment.createdAt });
        if (pkg.loadedInLoading)
            timeline.push({ stage: 'LOADING', ref: pkg.loadedInLoading.loadingNumber, at: pkg.loadedInLoading.createdAt });
        if (pkg.confirmedInConfirmation)
            timeline.push({ stage: 'DISPATCH_CONFIRMATION', ref: pkg.confirmedInConfirmation.confirmationNumber, at: pkg.confirmedInConfirmation.createdAt });
        if (pkg.gateOut)
            timeline.push({ stage: 'GATE_OUT', ref: pkg.gateOut.gateOutNumber, vehicleNumber: pkg.gateOut.vehicleNumber, at: pkg.gateOut.gateOutAt });
        const sourceTrace = await Promise.all(pkg.items.map(async (item) => {
            const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
            if (!verificationItem)
                return null;
            const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
            if (!pickListItem)
                return null;
            if (pickListItem.batchId) {
                const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
                return { itemCode: verificationItem.itemCode, saleType: verificationItem.saleType, source: 'BATCH', batchNumber: batch === null || batch === void 0 ? void 0 : batch.batchNumber };
            }
            if (verificationItem.saleType === 'SFG') {
                const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
                if (reservation === null || reservation === void 0 ? void 0 : reservation.workOrderId) {
                    const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
                    return { itemCode: verificationItem.itemCode, saleType: 'SFG', source: 'WORK_ORDER', workOrderNumber: wo === null || wo === void 0 ? void 0 : wo.woNumber, stageName: wo === null || wo === void 0 ? void 0 : wo.stageName };
                }
            }
            return { itemCode: verificationItem.itemCode, saleType: verificationItem.saleType, source: 'UNTRACKED' };
        }));
        return {
            packageId, packageNumber: pkg.packageNumber, currentStatus: pkg.status,
            timeline: timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
            sourceTrace: sourceTrace.filter(Boolean),
        };
    }
    async trace(query, user) {
        let packageIds = [];
        if (query.packageNumber) {
            const pkg = await this.prisma.dispatchPackage.findFirst({ where: { packageNumber: query.packageNumber } });
            if (pkg)
                packageIds = [pkg.id];
        }
        else if (query.gateOutNumber) {
            const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { gateOutNumber: query.gateOutNumber, companyId: user.companyId }, include: { packages: true } });
            if (gateOut)
                packageIds = gateOut.packages.map((p) => p.id);
        }
        else if (query.soNumber) {
            const so = await this.prisma.salesOrder.findFirst({ where: { soNumber: query.soNumber, companyId: user.companyId } });
            if (so) {
                const packages = await this.prisma.dispatchPackage.findMany({ where: { packing: { verification: { pickList: { dispatchPlan: { soId: so.id } } } } } });
                packageIds = packages.map((p) => p.id);
            }
        }
        if (packageIds.length === 0)
            throw new common_1.NotFoundException('No matching Dispatch trace found for this reference');
        return Promise.all(packageIds.map((id) => this.tracePackage(id, user)));
    }
};
exports.DispatchTraceService = DispatchTraceService;
exports.DispatchTraceService = DispatchTraceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DispatchTraceService);
//# sourceMappingURL=dispatch-trace.service.js.map