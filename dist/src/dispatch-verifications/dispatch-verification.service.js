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
exports.DispatchVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DispatchVerificationService = class DispatchVerificationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchVerification.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DV-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            pickList: { select: { pickListNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            items: true,
        };
    }
    async createVerification(pickListId, user) {
        const pickList = await this.prisma.pickList.findFirst({ where: { id: pickListId, companyId: user.companyId } });
        if (!pickList)
            throw new common_1.NotFoundException('Pick List not found');
        if (pickList.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Pick List is cancelled');
        if (pickList.status === 'CREATED')
            throw new common_1.BadRequestException('This Pick List has no picked quantity yet');
        const verificationNumber = await this.generateNumber(user.companyId);
        const verification = await this.prisma.dispatchVerification.create({
            data: {
                verificationNumber, pickListId, soId: pickList.soId, customerName: pickList.customerName,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'dispatch_verifications', recordId: verification.id, action: 'CREATE', newValues: verification, changedBy: user.id });
        return verification;
    }
    async remainingToVerify(pickListItemId, pickedQty, pickReversedQty) {
        const agg = await this.prisma.dispatchVerificationItem.aggregate({
            where: { pickListItemId, isActive: true },
            _sum: { verifiedQty: true, reversedQty: true },
        });
        const netVerified = (agg._sum.verifiedQty || 0) - (agg._sum.reversedQty || 0);
        return Math.max(pickedQty - pickReversedQty - netVerified, 0);
    }
    async revalidateQuality(pickListItem) {
        if (pickListItem.batchId) {
            const batch = await this.prisma.stockBatch.findUnique({ where: { id: pickListItem.batchId } });
            if (!batch || batch.status !== 'ACTIVE') {
                const reason = !batch ? 'BLOCKED_STOCK' : batch.status === 'EXPIRED' ? 'BLOCKED_STOCK' : batch.status === 'QUARANTINED' ? 'QC_HOLD' : 'BLOCKED_STOCK';
                return { ok: false, reason };
            }
        }
        else if (pickListItem.saleType === 'SFG') {
            const reservation = await this.prisma.dispatchReservation.findUnique({ where: { id: pickListItem.dispatchReservationId } });
            if (reservation === null || reservation === void 0 ? void 0 : reservation.workOrderId) {
                const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
                if (!wo || wo.stageStatus === 'BLOCKED')
                    return { ok: false, reason: 'STAGE_MISMATCH' };
            }
        }
        return { ok: true };
    }
    async verifyItem(verificationId, pickListItemId, verifiedQty, user) {
        const verification = await this.prisma.dispatchVerification.findFirst({ where: { id: verificationId, companyId: user.companyId } });
        if (!verification)
            throw new common_1.NotFoundException('Verification not found');
        if (verification.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Verification is cancelled');
        const pickListItem = await this.prisma.pickListItem.findFirst({
            where: { id: pickListItemId, isActive: true, pickListId: verification.pickListId },
        });
        if (!pickListItem)
            throw new common_1.NotFoundException('Pick event not found on this Pick List');
        if (pickListItem.status === 'REVERSED')
            throw new common_1.BadRequestException('This pick has been fully reversed and cannot be verified');
        const quality = await this.revalidateQuality(pickListItem);
        const remaining = await this.remainingToVerify(pickListItemId, pickListItem.pickedQty, pickListItem.reversedQty);
        if (verifiedQty > remaining) {
            throw new common_1.BadRequestException(`Verify qty ${verifiedQty} exceeds what remains to verify on this pick (${remaining}).`);
        }
        const item = await this.prisma.dispatchVerificationItem.create({
            data: {
                verificationId, pickListItemId, soItemId: pickListItem.soItemId, itemCode: pickListItem.itemCode, itemName: pickListItem.itemName,
                saleType: pickListItem.saleType,
                verifiedQty: quality.ok ? verifiedQty : 0,
                exceptionQty: quality.ok ? 0 : verifiedQty,
                exceptionReason: quality.ok ? null : quality.reason,
                status: quality.ok ? 'VERIFIED' : 'EXCEPTION',
                createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.refreshVerificationStatus(verificationId, user);
        await this.audit.log({
            tableName: 'dispatch_verification_items', recordId: item.id, action: 'CREATE',
            newValues: { verificationId, pickListItemId, requestedQty: verifiedQty, result: quality },
            changedBy: user.id,
        });
        if (!quality.ok) {
            throw new common_1.BadRequestException(`Verification blocked: ${quality.reason} - current quality status no longer eligible.`);
        }
        return item;
    }
    async refreshVerificationStatus(verificationId, user) {
        const items = await this.prisma.dispatchVerificationItem.findMany({ where: { verificationId, isActive: true } });
        const pickItemIds = [...new Set(items.map(i => i.pickListItemId))];
        const pickItems = await this.prisma.pickListItem.findMany({ where: { id: { in: pickItemIds } } });
        const totalPicked = pickItems.reduce((s, p) => s + (p.pickedQty - p.reversedQty), 0);
        const totalVerified = items.reduce((s, i) => s + (i.verifiedQty - i.reversedQty), 0);
        const hasException = items.some(i => i.status === 'EXCEPTION');
        const status = hasException && totalVerified <= 0.0001 ? 'EXCEPTION'
            : totalVerified <= 0.0001 ? 'PENDING'
                : totalVerified >= totalPicked - 0.0001 ? (hasException ? 'PARTIALLY_VERIFIED' : 'VERIFIED')
                    : 'PARTIALLY_VERIFIED';
        await this.prisma.dispatchVerification.update({ where: { id: verificationId }, data: { status, updatedBy: user.id } });
    }
    async reverseVerification(verificationItemId, reverseQty, reason, user) {
        const item = await this.prisma.dispatchVerificationItem.findFirst({
            where: { id: verificationItemId, isActive: true, verification: { companyId: user.companyId } },
        });
        if (!item)
            throw new common_1.NotFoundException('Verification event not found');
        const stillVerified = item.verifiedQty - item.reversedQty;
        if (reverseQty > stillVerified)
            throw new common_1.BadRequestException(`Cannot reverse ${reverseQty} - only ${stillVerified} is currently verified.`);
        const newReversedQty = item.reversedQty + reverseQty;
        const updated = await this.prisma.dispatchVerificationItem.update({
            where: { id: item.id },
            data: { reversedQty: newReversedQty, status: newReversedQty >= item.verifiedQty - 0.0001 ? 'REVERSED' : 'VERIFIED', reason, updatedBy: user.id },
        });
        await this.refreshVerificationStatus(item.verificationId, user);
        await this.audit.log({ tableName: 'dispatch_verification_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
        return updated;
    }
    async findOne(id, user) {
        const verification = await this.prisma.dispatchVerification.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!verification)
            throw new common_1.NotFoundException('Verification not found');
        return verification;
    }
};
exports.DispatchVerificationService = DispatchVerificationService;
exports.DispatchVerificationService = DispatchVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DispatchVerificationService);
//# sourceMappingURL=dispatch-verification.service.js.map