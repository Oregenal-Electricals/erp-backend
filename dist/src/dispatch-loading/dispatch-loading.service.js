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
exports.DispatchLoadingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DispatchLoadingService = class DispatchLoadingService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchLoading.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `LD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            transportAssignment: { select: { assignmentNumber: true, vehicleNumber: true, transporterName: true } },
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            packages: { include: { items: true } },
            items: true,
        };
    }
    checkVehicleMatch(assignment, actualVehicleNumber) {
        if (actualVehicleNumber && assignment.vehicleNumber && actualVehicleNumber !== assignment.vehicleNumber) {
            throw new common_1.BadRequestException(`Vehicle mismatch: assigned ${assignment.vehicleNumber}, actual ${actualVehicleNumber}. Loading blocked pending controlled reassignment.`);
        }
    }
    async startLoading(transportAssignmentId, actualVehicleNumber, user) {
        const assignment = await this.prisma.dispatchTransportAssignment.findFirst({ where: { id: transportAssignmentId, companyId: user.companyId } });
        if (!assignment)
            throw new common_1.NotFoundException('Transport Assignment not found');
        if (assignment.status !== 'ASSIGNED')
            throw new common_1.BadRequestException('This Transport Assignment must be confirmed (ASSIGNED) before loading can start');
        this.checkVehicleMatch(assignment, actualVehicleNumber);
        const loadingNumber = await this.generateNumber(user.companyId);
        const loading = await this.prisma.dispatchLoading.create({
            data: {
                loadingNumber, transportAssignmentId, dispatchPlanId: assignment.dispatchPlanId, soId: assignment.soId, customerName: assignment.customerName,
                status: 'IN_PROGRESS', startedAt: new Date(), startedBy: user.id,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_loadings', recordId: loading.id, action: 'CREATE', newValues: loading, changedBy: user.id });
        return loading;
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
    async loadPackage(loadingId, packageId, actualVehicleNumber, user) {
        const loading = await this.prisma.dispatchLoading.findFirst({ where: { id: loadingId, companyId: user.companyId }, include: { transportAssignment: true } });
        if (!loading)
            throw new common_1.NotFoundException('Loading not found');
        if (!['DRAFT', 'IN_PROGRESS', 'PARTIALLY_LOADED'].includes(loading.status))
            throw new common_1.BadRequestException(`This Loading is ${loading.status} and not open for loading`);
        this.checkVehicleMatch(loading.transportAssignment, actualVehicleNumber);
        const pkg = await this.prisma.dispatchPackage.findFirst({
            where: { id: packageId, isActive: true, status: 'ACTIVE', assignedTransportAssignmentId: loading.transportAssignmentId },
            include: { items: true },
        });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found, not Active, or not assigned to this vehicle/Dispatch');
        const quality = await this.revalidatePackageQuality(pkg);
        if (!quality.ok) {
            await this.prisma.dispatchLoadingItem.create({
                data: { loadingId, packageId, status: 'EXCEPTION', exceptionReason: quality.reason, loadedBy: user.id, createdBy: user.id, updatedBy: user.id },
            });
            throw new common_1.BadRequestException(`Loading blocked: ${quality.reason} - current quality status no longer eligible for loading.`);
        }
        const claim = await this.prisma.$executeRaw `
      UPDATE dispatch_packages SET "loadedInLoadingId" = ${loadingId}, "updatedBy" = ${user.id}
      WHERE id = ${packageId} AND "loadedInLoadingId" IS NULL
    `;
        if (claim === 0)
            throw new common_1.BadRequestException('This package is already loaded (duplicate scan blocked)');
        const item = await this.prisma.dispatchLoadingItem.create({
            data: { loadingId, packageId, status: 'LOADED', loadedBy: user.id, createdBy: user.id, updatedBy: user.id },
        });
        await this.refreshLoadingStatus(loadingId, user);
        await this.audit.log({ tableName: 'dispatch_loading_items', recordId: item.id, action: 'CREATE', newValues: { loadingId, packageId }, changedBy: user.id });
        return item;
    }
    async refreshLoadingStatus(loadingId, user) {
        const loading = await this.prisma.dispatchLoading.findUnique({ where: { id: loadingId }, include: { transportAssignment: { include: { packages: true } }, items: true } });
        if (!loading)
            return;
        const assignedCount = loading.transportAssignment.packages.length;
        const loadedCount = loading.items.filter((i) => i.isActive && i.status === 'LOADED').length;
        const status = loadedCount === 0 ? 'IN_PROGRESS' : loadedCount >= assignedCount ? 'PARTIALLY_LOADED' : 'PARTIALLY_LOADED';
        if (loading.status !== 'COMPLETE') {
            await this.prisma.dispatchLoading.update({ where: { id: loadingId }, data: { status, updatedBy: user.id } });
        }
    }
    async unloadPackage(loadingItemId, reason, user) {
        const item = await this.prisma.dispatchLoadingItem.findFirst({ where: { id: loadingItemId, isActive: true, loading: { companyId: user.companyId } } });
        if (!item)
            throw new common_1.NotFoundException('Loading event not found');
        if (item.status !== 'LOADED')
            throw new common_1.BadRequestException(`This item is ${item.status}, not currently loaded`);
        const pkgForUnload = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
        if (pkgForUnload === null || pkgForUnload === void 0 ? void 0 : pkgForUnload.gateOutId)
            throw new common_1.BadRequestException('This package has already been Gated-Out - simple unload is no longer permitted');
        await this.prisma.dispatchPackage.updateMany({ where: { id: item.packageId, loadedInLoadingId: item.loadingId }, data: { loadedInLoadingId: null } });
        const updated = await this.prisma.dispatchLoadingItem.update({
            where: { id: item.id },
            data: { status: 'UNLOADED', unloadedBy: user.id, unloadedAt: new Date(), reason, updatedBy: user.id },
        });
        await this.refreshLoadingStatus(item.loadingId, user);
        await this.audit.log({ tableName: 'dispatch_loading_items', recordId: item.id, action: 'UPDATE', newValues: { status: 'UNLOADED', reason }, changedBy: user.id });
        return updated;
    }
    async completeLoading(loadingId, user) {
        const loading = await this.prisma.dispatchLoading.findFirst({ where: { id: loadingId, companyId: user.companyId }, include: { items: true } });
        if (!loading)
            throw new common_1.NotFoundException('Loading not found');
        const loadedCount = loading.items.filter((i) => i.isActive && i.status === 'LOADED').length;
        if (loadedCount === 0)
            throw new common_1.BadRequestException('Load at least one package before completing');
        const updated = await this.prisma.dispatchLoading.update({
            where: { id: loadingId }, data: { status: 'COMPLETE', completedAt: new Date(), completedBy: user.id, updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_loadings', recordId: loadingId, action: 'UPDATE', newValues: { status: 'COMPLETE' }, changedBy: user.id });
        return updated;
    }
    async findOne(id, user) {
        const loading = await this.prisma.dispatchLoading.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!loading)
            throw new common_1.NotFoundException('Loading not found');
        return loading;
    }
};
exports.DispatchLoadingService = DispatchLoadingService;
exports.DispatchLoadingService = DispatchLoadingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DispatchLoadingService);
//# sourceMappingURL=dispatch-loading.service.js.map