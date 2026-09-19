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
exports.DispatchGateOutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const dispatch_document_readiness_service_1 = require("../dispatch-document-readiness/dispatch-document-readiness.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let DispatchGateOutService = class DispatchGateOutService {
    constructor(prisma, audit, readiness, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.readiness = readiness;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchGateOut.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `GO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            dispatchConfirmation: { select: { confirmationNumber: true, confirmationType: true } },
            transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            items: true,
        };
    }
    async revalidatePackageQuality(pkg) {
        for (const item of pkg.items) {
            const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
            if (!verificationItem)
                continue;
            const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
            if (!pickListItem)
                continue;
            if (pickListItem.batchId) {
                const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
                if (!batch || batch.status !== 'ACTIVE')
                    return { ok: false, reason: (batch === null || batch === void 0 ? void 0 : batch.status) === 'QUARANTINED' ? 'QUALITY_HOLD' : 'BLOCKED_STOCK' };
            }
            else if (verificationItem.saleType === 'SFG') {
                const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
                if (reservation === null || reservation === void 0 ? void 0 : reservation.workOrderId) {
                    const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
                    if (!wo || wo.stageStatus === 'BLOCKED')
                        return { ok: false, reason: 'STAGE_MISMATCH' };
                }
            }
        }
        return { ok: true };
    }
    async confirmGateOut(dispatchConfirmationId, actualVehicleNumber, user) {
        var _a, _b;
        const existing = await this.prisma.dispatchGateOut.findUnique({ where: { dispatchConfirmationId }, include: this.includes() });
        if (existing)
            return existing;
        const confirmation = await this.prisma.dispatchConfirmation.findFirst({
            where: { id: dispatchConfirmationId, companyId: user.companyId },
            include: { transportAssignment: true, items: { where: { isActive: true, status: 'CONFIRMED' } } },
        });
        if (!confirmation)
            throw new common_1.NotFoundException('Dispatch Confirmation not found');
        if (confirmation.status !== 'READY_FOR_GATE_OUT') {
            throw new common_1.BadRequestException(`This Dispatch Confirmation is ${confirmation.status}, not READY FOR GATE-OUT`);
        }
        if (actualVehicleNumber && confirmation.transportAssignment.vehicleNumber && actualVehicleNumber !== confirmation.transportAssignment.vehicleNumber) {
            throw new common_1.BadRequestException(`Vehicle mismatch: expected ${confirmation.transportAssignment.vehicleNumber}, actual ${actualVehicleNumber}. Gate-Out blocked pending controlled correction.`);
        }
        const docReadiness = await this.readiness.checkReadiness(confirmation.dispatchPlanId, user);
        if (docReadiness.overall !== 'DOCUMENTS_READY') {
            throw new common_1.BadRequestException(`Gate-Out blocked: commercial documents are ${docReadiness.overall}, not ready.`);
        }
        const packages = await this.prisma.dispatchPackage.findMany({
            where: { id: { in: confirmation.items.map((i) => i.packageId) }, isActive: true, status: 'ACTIVE' },
            include: { items: true },
        });
        if (packages.length === 0)
            throw new common_1.BadRequestException('No valid confirmed packages found for Gate-Out');
        for (const pkg of packages) {
            const quality = await this.revalidatePackageQuality(pkg);
            if (!quality.ok)
                throw new common_1.BadRequestException(`Gate-Out blocked: package quality is ${quality.reason}.`);
        }
        const gateOutNumber = await this.generateNumber(user.companyId);
        const gateOut = await this.prisma.dispatchGateOut.create({
            data: {
                gateOutNumber, dispatchConfirmationId, transportAssignmentId: confirmation.transportAssignmentId,
                dispatchPlanId: confirmation.dispatchPlanId, soId: confirmation.soId, customerName: confirmation.customerName,
                vehicleNumber: confirmation.transportAssignment.vehicleNumber, gateOutBy: user.id,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        for (const pkg of packages) {
            const claim = await this.prisma.$executeRaw `
        UPDATE dispatch_packages SET "gateOutId" = ${gateOut.id}, "status" = 'DISPATCHED', "updatedBy" = ${user.id}
        WHERE id = ${pkg.id} AND "gateOutId" IS NULL
      `;
            if (claim === 0)
                throw new common_1.BadRequestException(`Package ${pkg.packageNumber} has already been Gated-Out`);
            for (const item of pkg.items) {
                const verificationItem = await this.prisma.dispatchVerificationItem.findUnique({ where: { id: item.verificationItemId } });
                if (!verificationItem)
                    continue;
                const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
                if (!pickListItem)
                    continue;
                const netQty = item.packedQty - item.reversedQty;
                if (netQty <= 0)
                    continue;
                const soItem = await this.prisma.salesOrderItem.findUnique({ where: { id: pickListItem.soItemId } });
                if (!soItem)
                    continue;
                if (pickListItem.batchId) {
                    const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
                    if (batch) {
                        const balance = await this.prisma.stockBalance.findFirst({ where: { companyId: user.companyId, itemCode: verificationItem.itemCode, warehouseId: batch.warehouseId } });
                        if (balance) {
                            await this.stockLedger.postTransaction({
                                companyId: user.companyId, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
                                warehouseId: batch.warehouseId, transactionType: 'ISSUE', referenceType: 'DISPATCH_GATE_OUT', referenceNumber: gateOutNumber,
                                outQty: netQty, unitCost: balance.unitCost, remarks: `Gate-Out against SO ${confirmation.customerName}`, userId: user.id,
                            });
                        }
                    }
                }
                else if (verificationItem.saleType === 'SFG') {
                    const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
                    if (reservation === null || reservation === void 0 ? void 0 : reservation.workOrderId) {
                        await this.prisma.workOrder.update({
                            where: { id: reservation.workOrderId },
                            data: { dispatchReservedQty: { decrement: netQty } },
                        });
                    }
                }
                const newDispatched = soItem.dispatchedQty + netQty;
                const newPending = Math.max(0, soItem.qty - newDispatched);
                await this.prisma.salesOrderItem.update({ where: { id: soItem.id }, data: { dispatchedQty: newDispatched, pendingQty: newPending, updatedBy: user.id } });
                if (pickListItem.dispatchReservationId) {
                    const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
                    if (reservation) {
                        const newReleased = reservation.releasedQty + netQty;
                        await this.prisma.dispatchReservation.update({
                            where: { id: reservation.id },
                            data: { releasedQty: newReleased, status: newReleased >= reservation.reservedQty ? 'FULFILLED' : 'PARTIALLY_RELEASED' },
                        });
                    }
                }
                await this.prisma.dispatchGateOutItem.create({
                    data: {
                        gateOutId: gateOut.id, packageId: pkg.id, soItemId: soItem.id, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
                        saleType: verificationItem.saleType, qty: netQty,
                        warehouseId: pickListItem.batchId ? (_a = (await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } }))) === null || _a === void 0 ? void 0 : _a.warehouseId : null,
                        workOrderId: verificationItem.saleType === 'SFG' ? (_b = (await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } }))) === null || _b === void 0 ? void 0 : _b.workOrderId : null,
                        dispatchReservationId: pickListItem.dispatchReservationId,
                        createdBy: user.id, updatedBy: user.id,
                    },
                });
            }
        }
        await this.prisma.dispatchConfirmation.update({ where: { id: dispatchConfirmationId }, data: { status: 'GATED_OUT', updatedBy: user.id } });
        const updatedSo = await this.prisma.salesOrder.findFirst({ where: { id: confirmation.soId }, include: { items: true } });
        if (updatedSo) {
            const allDispatched = updatedSo.items.every((i) => i.pendingQty <= 0);
            await this.prisma.salesOrder.update({ where: { id: confirmation.soId }, data: { status: allDispatched ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED', updatedBy: user.id } });
        }
        await this.audit.log({ tableName: 'dispatch_gate_outs', recordId: gateOut.id, action: 'CREATE', newValues: gateOut, changedBy: user.id });
        return this.findOne(gateOut.id, user);
    }
    async findOne(id, user) {
        const gateOut = await this.prisma.dispatchGateOut.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!gateOut)
            throw new common_1.NotFoundException('Gate-Out not found');
        return gateOut;
    }
};
exports.DispatchGateOutService = DispatchGateOutService;
exports.DispatchGateOutService = DispatchGateOutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        dispatch_document_readiness_service_1.DispatchDocumentReadinessService,
        stock_ledger_service_1.StockLedgerService])
], DispatchGateOutService);
//# sourceMappingURL=dispatch-gate-out.service.js.map