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
exports.DispatchPackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DispatchPackingService = class DispatchPackingService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generatePackingNumber(companyId) {
        const count = await this.prisma.dispatchPacking.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DPK-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async generatePackageNumber(companyId) {
        const count = await this.prisma.dispatchPackage.count({ where: { packing: { companyId } } });
        return `PKG-${String(count + 1).padStart(6, '0')}`;
    }
    includes() {
        return {
            verification: { select: { verificationNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            packages: { include: { items: true } },
        };
    }
    async createPacking(verificationId, user) {
        const verification = await this.prisma.dispatchVerification.findFirst({ where: { id: verificationId, companyId: user.companyId } });
        if (!verification)
            throw new common_1.NotFoundException('Verification not found');
        if (verification.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Verification is cancelled');
        if (verification.status === 'PENDING' || verification.status === 'EXCEPTION') {
            throw new common_1.BadRequestException('This Verification has no verified quantity yet to pack');
        }
        const packingNumber = await this.generatePackingNumber(user.companyId);
        const packing = await this.prisma.dispatchPacking.create({
            data: {
                packingNumber, verificationId, soId: verification.soId, customerName: verification.customerName,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_packings', recordId: packing.id, action: 'CREATE', newValues: packing, changedBy: user.id });
        return packing;
    }
    async createPackage(packingId, user, packageType, netWeight, grossWeight) {
        const packing = await this.prisma.dispatchPacking.findFirst({ where: { id: packingId, companyId: user.companyId } });
        if (!packing)
            throw new common_1.NotFoundException('Packing not found');
        if (packing.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Packing is cancelled');
        const packageNumber = await this.generatePackageNumber(user.companyId);
        const pkg = await this.prisma.dispatchPackage.create({
            data: { packingId, packageNumber, packageType: packageType || 'CARTON', netWeight, grossWeight, createdBy: user.id, updatedBy: user.id },
            include: { items: true },
        });
        await this.audit.log({ tableName: 'dispatch_packages', recordId: pkg.id, action: 'CREATE', newValues: pkg, changedBy: user.id });
        return pkg;
    }
    async remainingToPack(verificationItemId, verifiedQty, verifyReversedQty) {
        const agg = await this.prisma.dispatchPackageItem.aggregate({
            where: { verificationItemId, isActive: true },
            _sum: { packedQty: true, reversedQty: true },
        });
        const netPacked = (agg._sum.packedQty || 0) - (agg._sum.reversedQty || 0);
        return Math.max(verifiedQty - verifyReversedQty - netPacked, 0);
    }
    async revalidateQuality(verificationItem) {
        const pickListItem = await this.prisma.pickListItem.findUnique({ where: { id: verificationItem.pickListItemId } });
        if (!pickListItem)
            return { ok: false, reason: 'BLOCKED_STOCK' };
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
        return { ok: true };
    }
    async addPackageItem(packageId, verificationItemId, packedQty, user) {
        const pkg = await this.prisma.dispatchPackage.findFirst({ where: { id: packageId, packing: { companyId: user.companyId } } });
        if (!pkg)
            throw new common_1.NotFoundException('Package not found');
        if (pkg.status === 'REVERSED')
            throw new common_1.BadRequestException('This package has been reversed');
        const verificationItem = await this.prisma.dispatchVerificationItem.findFirst({ where: { id: verificationItemId, isActive: true } });
        if (!verificationItem)
            throw new common_1.NotFoundException('Verification event not found');
        if (verificationItem.status !== 'VERIFIED')
            throw new common_1.BadRequestException(`This verification event is ${verificationItem.status}, not eligible for packing`);
        const quality = await this.revalidateQuality(verificationItem);
        const remaining = await this.remainingToPack(verificationItemId, verificationItem.verifiedQty, verificationItem.reversedQty);
        if (packedQty > remaining) {
            throw new common_1.BadRequestException(`Pack qty ${packedQty} exceeds what remains to pack on this verification (${remaining}).`);
        }
        const item = await this.prisma.dispatchPackageItem.create({
            data: {
                packageId, verificationItemId, itemCode: verificationItem.itemCode, itemName: verificationItem.itemName,
                saleType: verificationItem.saleType,
                packedQty: quality.ok ? packedQty : 0,
                status: quality.ok ? 'PACKED' : 'REVERSED',
                reason: quality.ok ? null : quality.reason,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.refreshPackingStatus(pkg.packingId, user);
        await this.audit.log({
            tableName: 'dispatch_package_items', recordId: item.id, action: 'CREATE',
            newValues: { packageId, verificationItemId, requestedQty: packedQty, result: quality },
            changedBy: user.id,
        });
        if (!quality.ok) {
            throw new common_1.BadRequestException(`Packing blocked: ${quality.reason} - current quality status no longer eligible for packing.`);
        }
        return item;
    }
    async refreshPackingStatus(packingId, user) {
        const packing = await this.prisma.dispatchPacking.findUnique({ where: { id: packingId }, include: { verification: { include: { items: true } }, packages: { include: { items: true } } } });
        if (!packing)
            return;
        const totalVerified = packing.verification.items.filter((i) => i.isActive).reduce((s, i) => s + (i.verifiedQty - i.reversedQty), 0);
        const allPackageItems = packing.packages.flatMap((p) => p.items).filter((i) => i.isActive);
        const totalPacked = allPackageItems.reduce((s, i) => s + (i.packedQty - i.reversedQty), 0);
        const status = totalPacked <= 0.0001 ? 'DRAFT' : totalPacked >= totalVerified - 0.0001 ? 'PACKED' : 'PARTIALLY_PACKED';
        await this.prisma.dispatchPacking.update({ where: { id: packingId }, data: { status, updatedBy: user.id } });
    }
    async reversePackageItem(packageItemId, reverseQty, reason, user) {
        const item = await this.prisma.dispatchPackageItem.findFirst({
            where: { id: packageItemId, isActive: true, package: { packing: { companyId: user.companyId } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Package item not found');
        const pkgForUnpack = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
        if (pkgForUnpack === null || pkgForUnpack === void 0 ? void 0 : pkgForUnpack.gateOutId)
            throw new common_1.BadRequestException('This package has already been Gated-Out - simple unpack/repack is no longer permitted');
        const stillPacked = item.packedQty - item.reversedQty;
        if (reverseQty > stillPacked)
            throw new common_1.BadRequestException(`Cannot reverse ${reverseQty} - only ${stillPacked} is currently packed.`);
        const newReversedQty = item.reversedQty + reverseQty;
        const updated = await this.prisma.dispatchPackageItem.update({
            where: { id: item.id },
            data: { reversedQty: newReversedQty, status: newReversedQty >= item.packedQty - 0.0001 ? 'REVERSED' : 'PACKED', reason, updatedBy: user.id },
        });
        const pkg = await this.prisma.dispatchPackage.findUnique({ where: { id: item.packageId } });
        if (pkg)
            await this.refreshPackingStatus(pkg.packingId, user);
        await this.audit.log({ tableName: 'dispatch_package_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
        return updated;
    }
    async findOne(id, user) {
        const packing = await this.prisma.dispatchPacking.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!packing)
            throw new common_1.NotFoundException('Packing not found');
        return packing;
    }
};
exports.DispatchPackingService = DispatchPackingService;
exports.DispatchPackingService = DispatchPackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DispatchPackingService);
//# sourceMappingURL=dispatch-packing.service.js.map