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
exports.PhysicalVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const WHOLE_NUMBER_UOMS = ['PCS', 'NOS', 'BOX', 'UNIT', 'UNITS'];
let PhysicalVerificationService = class PhysicalVerificationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    computeResult(actualQty, expectedQty, uomMismatch, materialMismatch) {
        if (uomMismatch) {
            return { result: 'UOM_MISMATCH', differenceQty: null, shortQty: null, excessQty: null };
        }
        if (materialMismatch) {
            return { result: 'MATERIAL_MISMATCH', differenceQty: null, shortQty: null, excessQty: null };
        }
        const differenceQty = actualQty - expectedQty;
        const shortQty = Math.max(expectedQty - actualQty, 0);
        const excessQty = Math.max(actualQty - expectedQty, 0);
        let result;
        if (actualQty === 0)
            result = 'FULL_SHORT';
        else if (differenceQty === 0)
            result = 'QUANTITY_VERIFIED';
        else if (differenceQty < 0)
            result = 'SHORT_QUANTITY';
        else
            result = 'EXCESS_QUANTITY';
        return { result, differenceQty, shortQty, excessQty };
    }
    async verifyLine(itemId, dto, user) {
        var _a;
        const line = await this.prisma.storeReceivingItem.findFirst({
            where: { id: itemId, companyId: user.companyId },
            include: { storeReceiving: true },
        });
        if (!line)
            throw new common_1.NotFoundException('Store receiving line not found');
        if (dto.actualQty < 0)
            throw new common_1.BadRequestException('Actual physical quantity cannot be negative');
        const expectedUomUpper = (line.uom || '').toUpperCase();
        if (WHOLE_NUMBER_UOMS.includes(expectedUomUpper) && !Number.isInteger(dto.actualQty)) {
            throw new common_1.BadRequestException(`${line.uom} does not permit fractional quantities - enter a whole number`);
        }
        const uomMismatch = dto.actualUom.toUpperCase() !== expectedUomUpper;
        const { result, differenceQty, shortQty, excessQty } = this.computeResult(dto.actualQty, line.expectedQty, uomMismatch, !!dto.materialMismatch);
        const item = await this.prisma.item.findFirst({ where: { companyId: user.companyId, itemCode: line.itemCode } });
        if ((item === null || item === void 0 ? void 0 : item.isBatchTracked) && dto.batches && dto.batches.length > 0) {
            const batchTotal = dto.batches.reduce((sum, b) => sum + b.quantity, 0);
            if (Math.abs(batchTotal - dto.actualQty) > 0.0001) {
                throw new common_1.BadRequestException(`Batch quantities (${batchTotal}) do not reconcile to actual physical quantity (${dto.actualQty}) - unreconciled: ${Math.abs(batchTotal - dto.actualQty)}`);
            }
        }
        const oldValues = { actualVerifiedQty: line.actualVerifiedQty, result: line.result };
        const [updated] = await this.prisma.$transaction([
            this.prisma.storeReceivingItem.update({
                where: { id: itemId },
                data: {
                    actualVerifiedQty: dto.actualQty,
                    actualUom: dto.actualUom,
                    result, differenceQty, shortQty, excessQty,
                    damagedQty: (_a = dto.damagedQty) !== null && _a !== void 0 ? _a : null,
                    materialMismatch: !!dto.materialMismatch,
                    remarks: dto.remarks,
                    verifiedById: user.id, verifiedAt: new Date(),
                    updatedBy: user.id,
                },
                include: { batches: true },
            }),
            this.prisma.storeReceivingItemBatch.deleteMany({ where: { storeReceivingItemId: itemId } }),
        ]);
        let withBatches = updated;
        if (dto.batches && dto.batches.length > 0) {
            await this.prisma.storeReceivingItemBatch.createMany({
                data: dto.batches.map(b => ({
                    companyId: user.companyId, storeReceivingItemId: itemId,
                    batchNumber: b.batchNumber, lotNumber: b.lotNumber,
                    mfgDate: b.mfgDate ? new Date(b.mfgDate) : null,
                    expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
                    quantity: b.quantity, createdBy: user.id, updatedBy: user.id,
                })),
            });
            const batches = await this.prisma.storeReceivingItemBatch.findMany({ where: { storeReceivingItemId: itemId } });
            withBatches = Object.assign(Object.assign({}, updated), { batches });
        }
        await this.audit.log({
            tableName: 'store_receiving_items', recordId: itemId, action: 'UPDATE',
            oldValues, newValues: { actualVerifiedQty: dto.actualQty, result }, changedBy: user.id,
        });
        return withBatches;
    }
    async completeVerification(receivingId, user) {
        const receiving = await this.prisma.storeReceiving.findFirst({
            where: { id: receivingId, companyId: user.companyId },
            include: { items: true },
        });
        if (!receiving)
            throw new common_1.NotFoundException('Store receiving record not found');
        if (['VERIFIED', 'VERIFIED_WITH_DISCREPANCY'].includes(receiving.status)) {
            return receiving;
        }
        const unverified = receiving.items.filter(i => !i.result);
        if (unverified.length > 0) {
            throw new common_1.BadRequestException(`${unverified.length} line(s) still pending physical verification`);
        }
        const allMatched = receiving.items.every(i => i.result === 'QUANTITY_VERIFIED');
        const newStatus = allMatched ? 'VERIFIED' : 'VERIFIED_WITH_DISCREPANCY';
        const updated = await this.prisma.storeReceiving.update({
            where: { id: receivingId },
            data: { status: newStatus, updatedBy: user.id },
            include: { items: { include: { batches: true } } },
        });
        await this.audit.log({
            tableName: 'store_receivings', recordId: receivingId, action: 'UPDATE',
            oldValues: { status: receiving.status }, newValues: { status: newStatus }, changedBy: user.id,
        });
        return updated;
    }
    async correctLine(itemId, dto, user) {
        const line = await this.prisma.storeReceivingItem.findFirst({
            where: { id: itemId, companyId: user.companyId },
            include: { storeReceiving: true },
        });
        if (!line)
            throw new common_1.NotFoundException('Store receiving line not found');
        if (!line.verifiedAt)
            throw new common_1.BadRequestException('This line has not been verified yet - use verify, not correct');
        const downstreamGrn = await this.prisma.grnHeader.findFirst({
            where: { gateInwardEntryId: line.storeReceiving.gateInwardEntryId },
        });
        if (downstreamGrn) {
            throw new common_1.BadRequestException('A GRN already exists for this receipt - this quantity is protected and requires discrepancy/reversal handling, not a direct correction');
        }
        const expectedUomUpper = (line.uom || '').toUpperCase();
        const uomMismatch = (line.actualUom || '').toUpperCase() !== expectedUomUpper;
        const { result, differenceQty, shortQty, excessQty } = this.computeResult(dto.actualQty, line.expectedQty, uomMismatch, line.materialMismatch);
        const oldValues = { actualVerifiedQty: line.actualVerifiedQty, result: line.result };
        const updated = await this.prisma.storeReceivingItem.update({
            where: { id: itemId },
            data: {
                actualVerifiedQty: dto.actualQty, result, differenceQty, shortQty, excessQty,
                updatedBy: user.id,
            },
            include: { batches: true },
        });
        await this.audit.log({
            tableName: 'store_receiving_items', recordId: itemId, action: 'UPDATE',
            oldValues, newValues: { actualVerifiedQty: dto.actualQty, result, reason: dto.reason },
            changedBy: user.id,
        });
        return updated;
    }
};
exports.PhysicalVerificationService = PhysicalVerificationService;
exports.PhysicalVerificationService = PhysicalVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PhysicalVerificationService);
//# sourceMappingURL=physical-verification.service.js.map