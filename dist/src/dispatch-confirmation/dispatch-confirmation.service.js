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
exports.DispatchConfirmationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const dispatch_document_readiness_service_1 = require("../dispatch-document-readiness/dispatch-document-readiness.service");
let DispatchConfirmationService = class DispatchConfirmationService {
    constructor(prisma, audit, readiness) {
        this.prisma = prisma;
        this.audit = audit;
        this.readiness = readiness;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchConfirmation.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            loading: { select: { loadingNumber: true } },
            transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            packages: { include: { items: true } },
            items: true,
        };
    }
    async createConfirmation(loadingId, user) {
        const loading = await this.prisma.dispatchLoading.findFirst({
            where: { id: loadingId, companyId: user.companyId },
            include: { items: { where: { isActive: true, status: 'LOADED' } } },
        });
        if (!loading)
            throw new common_1.NotFoundException('Loading not found');
        if (loading.items.length === 0)
            throw new common_1.BadRequestException('This Loading has no valid loaded packages to confirm');
        const confirmationNumber = await this.generateNumber(user.companyId);
        const confirmation = await this.prisma.dispatchConfirmation.create({
            data: {
                confirmationNumber, loadingId, transportAssignmentId: loading.transportAssignmentId,
                dispatchPlanId: loading.dispatchPlanId, soId: loading.soId, customerName: loading.customerName,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_confirmations', recordId: confirmation.id, action: 'CREATE', newValues: confirmation, changedBy: user.id });
        return confirmation;
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
    async confirmPackage(confirmationId, packageId, user) {
        const confirmation = await this.prisma.dispatchConfirmation.findFirst({ where: { id: confirmationId, companyId: user.companyId } });
        if (!confirmation)
            throw new common_1.NotFoundException('Confirmation not found');
        if (!['PENDING_CONFIRMATION', 'PARTIALLY_CONFIRMED'].includes(confirmation.status)) {
            throw new common_1.BadRequestException(`This Confirmation is ${confirmation.status} and not open for confirmation`);
        }
        const pkg = await this.prisma.dispatchPackage.findFirst({
            where: { id: packageId, isActive: true, status: 'ACTIVE', loadedInLoadingId: confirmation.loadingId },
            include: { items: true },
        });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found, not Active, or not loaded under this Loading');
        const quality = await this.revalidatePackageQuality(pkg);
        const docReadiness = await this.readiness.checkReadiness(confirmation.dispatchPlanId, user);
        const documentsOk = docReadiness.overall === 'DOCUMENTS_READY';
        if (!quality.ok || !documentsOk) {
            const reason = !quality.ok ? quality.reason : `DOCUMENTS_${docReadiness.overall}`;
            await this.prisma.dispatchConfirmationItem.create({
                data: { confirmationId, packageId, status: 'EXCEPTION', exceptionReason: reason, confirmedBy: user.id, createdBy: user.id, updatedBy: user.id },
            });
            throw new common_1.BadRequestException(`Confirmation blocked: ${reason} - not eligible for Gate-Out readiness.`);
        }
        const claim = await this.prisma.$executeRaw `
      UPDATE dispatch_packages SET "confirmedInConfirmationId" = ${confirmationId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "confirmedInConfirmationId" IS NULL
    `;
        if (claim === 0)
            throw new common_1.BadRequestException('This package is already confirmed (duplicate confirmation blocked)');
        const item = await this.prisma.dispatchConfirmationItem.create({
            data: { confirmationId, packageId, status: 'CONFIRMED', confirmedBy: user.id, createdBy: user.id, updatedBy: user.id },
        });
        await this.refreshConfirmationStatus(confirmationId, user);
        await this.audit.log({ tableName: 'dispatch_confirmation_items', recordId: item.id, action: 'CREATE', newValues: { confirmationId, packageId }, changedBy: user.id });
        return item;
    }
    async refreshConfirmationStatus(confirmationId, user) {
        const confirmation = await this.prisma.dispatchConfirmation.findUnique({
            where: { id: confirmationId },
            include: { loading: { include: { items: { where: { isActive: true, status: 'LOADED' } } } }, items: true },
        });
        if (!confirmation)
            return;
        const loadedCount = confirmation.loading.items.length;
        const confirmedCount = confirmation.items.filter((i) => i.isActive && i.status === 'CONFIRMED').length;
        if (confirmedCount === 0)
            return;
        const status = confirmedCount >= loadedCount ? 'READY_FOR_GATE_OUT' : 'PARTIALLY_CONFIRMED';
        const confirmationType = confirmedCount >= loadedCount ? 'FULL' : 'PARTIAL';
        if (confirmation.status !== 'CANCELLED') {
            await this.prisma.dispatchConfirmation.update({
                where: { id: confirmationId },
                data: { status, confirmationType, confirmedAt: new Date(), confirmedBy: user.id, updatedBy: user.id },
            });
        }
    }
    async reverseConfirmationItem(itemId, reason, user) {
        const item = await this.prisma.dispatchConfirmationItem.findFirst({ where: { id: itemId, isActive: true, confirmation: { companyId: user.companyId } } });
        if (!item)
            throw new common_1.NotFoundException('Confirmation event not found');
        if (item.status !== 'CONFIRMED')
            throw new common_1.BadRequestException(`This item is ${item.status}, not currently confirmed`);
        const pkgForReversal = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
        if (pkgForReversal === null || pkgForReversal === void 0 ? void 0 : pkgForReversal.gateOutId)
            throw new common_1.BadRequestException('This package has already been Gated-Out - simple confirmation reversal is no longer permitted');
        await this.prisma.dispatchPackage.updateMany({ where: { id: item.packageId, confirmedInConfirmationId: item.confirmationId }, data: { confirmedInConfirmationId: null } });
        const updated = await this.prisma.dispatchConfirmationItem.update({
            where: { id: item.id },
            data: { status: 'REVERSED', reversedBy: user.id, reversedAt: new Date(), reason, updatedBy: user.id },
        });
        await this.refreshConfirmationStatus(item.confirmationId, user);
        await this.audit.log({ tableName: 'dispatch_confirmation_items', recordId: item.id, action: 'UPDATE', newValues: { status: 'REVERSED', reason }, changedBy: user.id });
        return updated;
    }
    async findOne(id, user) {
        const confirmation = await this.prisma.dispatchConfirmation.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!confirmation)
            throw new common_1.NotFoundException('Confirmation not found');
        return confirmation;
    }
};
exports.DispatchConfirmationService = DispatchConfirmationService;
exports.DispatchConfirmationService = DispatchConfirmationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        dispatch_document_readiness_service_1.DispatchDocumentReadinessService])
], DispatchConfirmationService);
//# sourceMappingURL=dispatch-confirmation.service.js.map