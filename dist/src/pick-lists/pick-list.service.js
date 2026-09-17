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
exports.PickListService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PickListService = class PickListService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.pickList.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PL-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            items: {
                include: {
                    dispatchReservation: { select: { reservationNumber: true, reservationType: true, reservedQty: true, releasedQty: true, warehouseId: true, workOrderId: true } },
                    batch: { select: { batchNumber: true, lotNumber: true } },
                },
            },
        };
    }
    async createPickList(dispatchPlanId, user) {
        const plan = await this.prisma.dispatchPlan.findFirst({ where: { id: dispatchPlanId, companyId: user.companyId } });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch Plan not found');
        if (plan.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Dispatch Plan is cancelled');
        const hasReservations = await this.prisma.dispatchReservation.count({
            where: { dispatchPlanId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
        });
        if (hasReservations === 0)
            throw new common_1.BadRequestException('This Dispatch Plan has no active reservation to pick against');
        const pickListNumber = await this.generateNumber(user.companyId);
        const pickList = await this.prisma.pickList.create({
            data: {
                pickListNumber, dispatchPlanId, soId: plan.soId, customerName: plan.customerName,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'pick_lists', recordId: pickList.id, action: 'CREATE', newValues: pickList, changedBy: user.id });
        return pickList;
    }
    async remainingToPick(tx, dispatchReservationId, reservedQty, releasedQty) {
        const agg = await tx.pickListItem.aggregate({
            where: { dispatchReservationId, isActive: true },
            _sum: { pickedQty: true, reversedQty: true },
        });
        const netPicked = (agg._sum.pickedQty || 0) - (agg._sum.reversedQty || 0);
        return Math.max(reservedQty - releasedQty - netPicked, 0);
    }
    async claimBatchAtomically(companyId, batchId, itemCode, warehouseId, wantQty, userId) {
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const batch = await this.prisma.stockBatch.findFirst({ where: { id: batchId, companyId } });
            if (!batch)
                throw new common_1.NotFoundException('Batch not found');
            if (batch.itemCode !== itemCode)
                throw new common_1.BadRequestException(`Batch ${batch.batchNumber} is for a different item`);
            if (warehouseId && batch.warehouseId !== warehouseId)
                throw new common_1.BadRequestException(`Batch ${batch.batchNumber} is not in the reserved warehouse`);
            if (batch.status !== 'ACTIVE')
                throw new common_1.BadRequestException(`Batch ${batch.batchNumber} is ${batch.status} and not eligible for picking`);
            const free = Math.max(batch.availableQty - batch.reservedQty, 0);
            const claimQty = Math.min(free, wantQty);
            if (claimQty <= 0.0001)
                throw new common_1.BadRequestException(`Batch ${batch.batchNumber} has no free quantity to pick`);
            const claim = await this.prisma.stockBatch.updateMany({
                where: { id: batch.id, reservedQty: batch.reservedQty },
                data: { reservedQty: { increment: claimQty }, updatedBy: userId },
            });
            if (claim.count === 1)
                return claimQty;
        }
        throw new common_1.BadRequestException('Could not claim batch - too many concurrent updates, please retry.');
    }
    async pickItem(pickListId, dispatchReservationId, batchId, pickQty, user) {
        const pickList = await this.prisma.pickList.findFirst({ where: { id: pickListId, companyId: user.companyId } });
        if (!pickList)
            throw new common_1.NotFoundException('Pick List not found');
        if (pickList.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Pick List is cancelled');
        const reservation = await this.prisma.dispatchReservation.findFirst({
            where: { id: dispatchReservationId, companyId: user.companyId, dispatchPlanId: pickList.dispatchPlanId, isActive: true },
        });
        if (!reservation)
            throw new common_1.NotFoundException('Reservation not found on this Dispatch Plan');
        if (!['ACTIVE', 'PARTIALLY_RELEASED'].includes(reservation.status)) {
            throw new common_1.BadRequestException(`Reservation ${reservation.reservationNumber} is ${reservation.status} and not eligible for picking`);
        }
        if (reservation.reservationType === 'SFG_DISPATCH') {
            const wo = await this.prisma.workOrder.findUnique({ where: { id: reservation.workOrderId } });
            if (!wo || wo.stageStatus === 'BLOCKED') {
                throw new common_1.BadRequestException('This Work Order/stage is Blocked and not eligible for picking (quality revalidation failed)');
            }
        }
        const remaining = await this.remainingToPick(this.prisma, dispatchReservationId, reservation.reservedQty, reservation.releasedQty);
        if (pickQty > remaining) {
            throw new common_1.BadRequestException(`Pick qty ${pickQty} exceeds what remains to pick on this reservation (${remaining}).`);
        }
        let actualPicked = pickQty;
        if (reservation.reservationType !== 'SFG_DISPATCH' && batchId) {
            actualPicked = await this.claimBatchAtomically(user.companyId, batchId, reservation.itemCode, reservation.warehouseId, pickQty, user.id);
        }
        const item = await this.prisma.pickListItem.create({
            data: {
                pickListId, dispatchReservationId, soItemId: reservation.soItemId, itemCode: reservation.itemCode, itemName: reservation.itemName,
                saleType: reservation.reservationType.replace('_DISPATCH', ''), batchId: reservation.reservationType === 'SFG_DISPATCH' ? null : (batchId || null),
                pickedQty: actualPicked, status: 'ACTIVE',
                createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.refreshPickListStatus(pickListId, user);
        await this.audit.log({
            tableName: 'pick_list_items', recordId: item.id, action: 'CREATE',
            newValues: { pickListId, dispatchReservationId, batchId, requestedQty: pickQty, actualPicked },
            changedBy: user.id,
        });
        return Object.assign(Object.assign({}, item), { requestedQty: pickQty, shortQty: Math.max(pickQty - actualPicked, 0) });
    }
    async refreshPickListStatus(pickListId, user) {
        const items = await this.prisma.pickListItem.findMany({ where: { pickListId, isActive: true } });
        const resIds = [...new Set(items.map(i => i.dispatchReservationId))];
        const reservations = await this.prisma.dispatchReservation.findMany({ where: { id: { in: resIds } } });
        const totalReserved = reservations.reduce((s, r) => s + (r.reservedQty - r.releasedQty), 0);
        const totalPicked = items.reduce((s, i) => s + (i.pickedQty - i.reversedQty), 0);
        const status = totalPicked <= 0.0001 ? 'CREATED' : totalPicked >= totalReserved - 0.0001 ? 'PICKED' : 'PARTIALLY_PICKED';
        await this.prisma.pickList.update({ where: { id: pickListId }, data: { status, updatedBy: user.id } });
    }
    async reversePick(pickListItemId, reverseQty, reason, user) {
        const item = await this.prisma.pickListItem.findFirst({
            where: { id: pickListItemId, isActive: true, pickList: { companyId: user.companyId } },
        });
        if (!item)
            throw new common_1.NotFoundException('Pick event not found');
        const stillPicked = item.pickedQty - item.reversedQty;
        if (reverseQty > stillPicked)
            throw new common_1.BadRequestException(`Cannot reverse ${reverseQty} - only ${stillPicked} is currently picked.`);
        if (item.batchId) {
            await this.prisma.stockBatch.updateMany({ where: { id: item.batchId }, data: { reservedQty: { decrement: reverseQty } } });
        }
        const newReversedQty = item.reversedQty + reverseQty;
        const updated = await this.prisma.pickListItem.update({
            where: { id: item.id },
            data: { reversedQty: newReversedQty, status: newReversedQty >= item.pickedQty - 0.0001 ? 'REVERSED' : 'ACTIVE', reason, updatedBy: user.id },
        });
        await this.refreshPickListStatus(item.pickListId, user);
        await this.audit.log({ tableName: 'pick_list_items', recordId: item.id, action: 'UPDATE', newValues: { reversedQty: newReversedQty, reason }, changedBy: user.id });
        return updated;
    }
    async findOne(id, user) {
        const pickList = await this.prisma.pickList.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!pickList)
            throw new common_1.NotFoundException('Pick List not found');
        return pickList;
    }
    async suggestBatches(dispatchReservationId, user) {
        const reservation = await this.prisma.dispatchReservation.findFirst({ where: { id: dispatchReservationId, companyId: user.companyId } });
        if (!reservation)
            throw new common_1.NotFoundException('Reservation not found');
        if (reservation.reservationType === 'SFG_DISPATCH')
            return [];
        const batches = await this.prisma.stockBatch.findMany({
            where: { companyId: user.companyId, itemCode: reservation.itemCode, warehouseId: reservation.warehouseId, status: 'ACTIVE', isActive: true },
            orderBy: { receivedDate: 'asc' },
        });
        return batches
            .map(b => ({ batchId: b.id, batchNumber: b.batchNumber, lotNumber: b.lotNumber, freeQty: Math.max(b.availableQty - b.reservedQty, 0) }))
            .filter(b => b.freeQty > 0.0001);
    }
};
exports.PickListService = PickListService;
exports.PickListService = PickListService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PickListService);
//# sourceMappingURL=pick-list.service.js.map