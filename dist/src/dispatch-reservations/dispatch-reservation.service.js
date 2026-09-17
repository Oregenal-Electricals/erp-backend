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
exports.DispatchReservationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DispatchReservationService = class DispatchReservationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.dispatchReservation.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DR-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            dispatchPlan: { select: { planNumber: true } },
            salesOrder: { select: { soNumber: true, customerName: true } },
            requiredStage: { select: { stageName: true } },
            workOrder: { select: { woNumber: true } },
        };
    }
    async claimRmFgAtomically(companyId, itemCode, warehouseType, plantId, wantQty, userId) {
        const warehouses = await this.prisma.warehouse.findMany({
            where: { companyId, plantId, type: { in: [warehouseType, 'GENERAL'] }, isActive: true },
            select: { id: true },
        });
        let remaining = wantQty;
        let totalClaimed = 0;
        let lastWarehouseId = null;
        for (const wh of warehouses) {
            if (remaining <= 0.0001)
                break;
            const MAX_RETRIES = 5;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                const stock = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode, warehouseId: wh.id } });
                if (!stock)
                    break;
                const freeAvailable = Math.max(stock.availableQty - stock.reservedQty, 0);
                const claimQty = Math.min(freeAvailable, remaining);
                if (claimQty <= 0.0001)
                    break;
                const claim = await this.prisma.stockBalance.updateMany({
                    where: { id: stock.id, reservedQty: stock.reservedQty },
                    data: { reservedQty: { increment: claimQty }, updatedBy: userId },
                });
                if (claim.count === 1) {
                    totalClaimed += claimQty;
                    remaining -= claimQty;
                    lastWarehouseId = wh.id;
                    break;
                }
            }
        }
        return { claimed: totalClaimed, warehouseId: lastWarehouseId };
    }
    async claimSfgAtomically(companyId, itemCode, stageName, plantId, wantQty, userId) {
        const wos = await this.prisma.workOrder.findMany({
            where: {
                companyId, productCode: itemCode, stageName,
                status: { in: ['RELEASED', 'IN_PROGRESS', 'COMPLETED'] },
                warehouse: { plantId },
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
        });
        let remaining = wantQty;
        const allocations = [];
        for (const wo of wos) {
            if (remaining <= 0.0001)
                break;
            const MAX_RETRIES = 5;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                const w = await this.prisma.workOrder.findUnique({ where: { id: wo.id }, select: { completedQty: true, cumulativeHandoverQty: true, dispatchReservedQty: true, stageStatus: true } });
                if (!w || w.stageStatus === 'BLOCKED')
                    break;
                const free = Math.max(w.completedQty - w.cumulativeHandoverQty - w.dispatchReservedQty, 0);
                const claimQty = Math.min(free, remaining);
                if (claimQty <= 0.0001)
                    break;
                const updated = await this.prisma.$executeRaw `
          UPDATE work_orders SET "dispatchReservedQty" = "dispatchReservedQty" + ${claimQty}, "updatedBy" = ${userId}
          WHERE id = ${wo.id} AND "completedQty" - "cumulativeHandoverQty" - "dispatchReservedQty" >= ${claimQty}
        `;
                if (updated === 1) {
                    allocations.push({ workOrderId: wo.id, claimed: claimQty });
                    remaining -= claimQty;
                    break;
                }
            }
        }
        return allocations;
    }
    async reserve(dispatchPlanItemId, requestedQty, user) {
        const planItem = await this.prisma.dispatchPlanItem.findFirst({
            where: { id: dispatchPlanItemId, isActive: true, plan: { companyId: user.companyId } },
            include: { plan: true, soItem: { include: { requiredStage: true } } },
        });
        if (!planItem)
            throw new common_1.NotFoundException('Dispatch Plan line not found');
        if (planItem.plan.status === 'CANCELLED')
            throw new common_1.BadRequestException('This Dispatch Plan is cancelled');
        if (!planItem.soItem.sourceValid || !planItem.sourceType)
            throw new common_1.BadRequestException('This line has no valid resolved source');
        const alreadyReservedAgg = await this.prisma.dispatchReservation.aggregate({
            where: { dispatchPlanItemId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
            _sum: { reservedQty: true, releasedQty: true },
        });
        const netAlreadyReserved = (alreadyReservedAgg._sum.reservedQty || 0) - (alreadyReservedAgg._sum.releasedQty || 0);
        const roomInPlan = Math.max(planItem.plannedQty - netAlreadyReserved, 0);
        if (roomInPlan <= 0.0001) {
            throw new common_1.BadRequestException(`This plan line is already fully reserved (${netAlreadyReserved} of ${planItem.plannedQty}).`);
        }
        const wantQty = Math.min(requestedQty, roomInPlan);
        const reservationNumber = await this.generateNumber(user.companyId);
        const created = [];
        let totalClaimed = 0;
        if (planItem.sourceType === 'RM_INVENTORY' || planItem.sourceType === 'FG_INVENTORY') {
            const warehouseType = planItem.sourceType === 'RM_INVENTORY' ? 'RAW_MATERIAL' : 'FINISHED_GOOD';
            const { claimed, warehouseId } = await this.claimRmFgAtomically(user.companyId, planItem.itemCode, warehouseType, planItem.sourcePlantId, wantQty, user.id);
            if (claimed > 0.0001) {
                const row = await this.prisma.dispatchReservation.create({
                    data: {
                        companyId: user.companyId, reservationNumber, dispatchPlanId: planItem.planId, dispatchPlanItemId: planItem.id,
                        soId: planItem.soItem.soId, soItemId: planItem.soItemId, itemCode: planItem.itemCode, itemName: planItem.itemName,
                        reservationType: planItem.sourceType === 'RM_INVENTORY' ? 'RM_DISPATCH' : 'FG_DISPATCH',
                        warehouseId, reservedQty: claimed, status: 'ACTIVE',
                        createdBy: user.id, updatedBy: user.id,
                    },
                    include: this.includes(),
                });
                created.push(row);
                totalClaimed = claimed;
            }
        }
        else if (planItem.sourceType === 'SFG_STAGE') {
            const allocations = await this.claimSfgAtomically(user.companyId, planItem.itemCode, planItem.soItem.requiredStage.stageName, planItem.sourcePlantId, wantQty, user.id);
            for (const alloc of allocations) {
                const row = await this.prisma.dispatchReservation.create({
                    data: {
                        companyId: user.companyId, reservationNumber, dispatchPlanId: planItem.planId, dispatchPlanItemId: planItem.id,
                        soId: planItem.soItem.soId, soItemId: planItem.soItemId, itemCode: planItem.itemCode, itemName: planItem.itemName,
                        reservationType: 'SFG_DISPATCH', workOrderId: alloc.workOrderId, requiredStageId: planItem.requiredStageId,
                        reservedQty: alloc.claimed, status: 'ACTIVE',
                        createdBy: user.id, updatedBy: user.id,
                    },
                    include: this.includes(),
                });
                created.push(row);
                totalClaimed += alloc.claimed;
            }
        }
        else {
            throw new common_1.BadRequestException(`Unrecognized source type "${planItem.sourceType}"`);
        }
        const status = totalClaimed <= 0.0001 ? 'NOT_RESERVED' : totalClaimed >= wantQty - 0.0001 ? 'FULLY_RESERVED' : 'PARTIALLY_RESERVED';
        await this.audit.log({
            tableName: 'dispatch_reservations', recordId: reservationNumber, action: 'CREATE',
            newValues: { reservationNumber, dispatchPlanItemId, requestedQty, totalClaimed, status, allocations: created.map(c => ({ id: c.id, workOrderId: c.workOrderId, warehouseId: c.warehouseId, reservedQty: c.reservedQty })) },
            changedBy: user.id,
        });
        return { reservationNumber, requestedQty, reservedQty: totalClaimed, unreservedQty: Math.max(wantQty - totalClaimed, 0), status, allocations: created };
    }
    async release(reservationNumber, releaseQty, reason, user) {
        const rows = await this.prisma.dispatchReservation.findMany({
            where: { reservationNumber, companyId: user.companyId, isActive: true, status: { in: ['ACTIVE', 'PARTIALLY_RELEASED'] } },
        });
        if (rows.length === 0)
            throw new common_1.NotFoundException('Active reservation not found');
        let remaining = releaseQty;
        const released = [];
        for (const row of rows) {
            if (remaining <= 0.0001)
                break;
            const stillHeld = row.reservedQty - row.releasedQty;
            const thisRelease = Math.min(stillHeld, remaining);
            if (thisRelease <= 0.0001)
                continue;
            if (row.reservationType === 'SFG_DISPATCH' && row.workOrderId) {
                await this.prisma.workOrder.update({ where: { id: row.workOrderId }, data: { dispatchReservedQty: { decrement: thisRelease } } });
            }
            else if (row.warehouseId) {
                await this.prisma.stockBalance.updateMany({ where: { companyId: user.companyId, itemCode: row.itemCode, warehouseId: row.warehouseId }, data: { reservedQty: { decrement: thisRelease } } });
            }
            const newReleasedQty = row.releasedQty + thisRelease;
            const newStatus = newReleasedQty >= row.reservedQty - 0.0001 ? 'RELEASED' : 'PARTIALLY_RELEASED';
            const updated = await this.prisma.dispatchReservation.update({
                where: { id: row.id },
                data: { releasedQty: newReleasedQty, status: newStatus, releaseReason: reason, updatedBy: user.id },
            });
            released.push(updated);
            remaining -= thisRelease;
        }
        await this.audit.log({
            tableName: 'dispatch_reservations', recordId: reservationNumber, action: 'UPDATE',
            newValues: { released: released.map(r => ({ id: r.id, releasedQty: r.releasedQty, status: r.status })), reason },
            changedBy: user.id,
        });
        return { reservationNumber, releasedQty: releaseQty - Math.max(remaining, 0), rows: released };
    }
    async findOne(reservationNumber, user) {
        const rows = await this.prisma.dispatchReservation.findMany({
            where: { reservationNumber, companyId: user.companyId },
            include: this.includes(),
        });
        if (rows.length === 0)
            throw new common_1.NotFoundException('Reservation not found');
        return rows;
    }
    async findByPlanItem(dispatchPlanItemId, user) {
        return this.prisma.dispatchReservation.findMany({
            where: { dispatchPlanItemId, companyId: user.companyId, isActive: true },
            include: this.includes(),
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.DispatchReservationService = DispatchReservationService;
exports.DispatchReservationService = DispatchReservationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DispatchReservationService);
//# sourceMappingURL=dispatch-reservation.service.js.map