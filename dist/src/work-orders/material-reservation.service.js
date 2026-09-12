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
exports.MaterialReservationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let MaterialReservationService = class MaterialReservationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async reserveForWorkOrder(workOrderId, user) {
        const wo = await this.prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: { bom: { include: { items: { where: { isActive: true } } } } },
        });
        if (!wo || !wo.bom)
            return [];
        const results = [];
        for (const bomItem of wo.bom.items) {
            const requiredQty = (bomItem.effectiveQty || bomItem.quantity) * wo.plannedQty;
            const existingForThisWo = await this.prisma.materialReservation.aggregate({
                where: { workOrderId, itemCode: bomItem.itemCode, status: 'ACTIVE' },
                _sum: { reservedQty: true },
            });
            const alreadyReservedForWo = existingForThisWo._sum.reservedQty || 0;
            const stillNeeded = Math.max(0, requiredQty - alreadyReservedForWo);
            let reservedNow = 0;
            if (stillNeeded > 0.0001) {
                reservedNow = await this.reserveQtyAtomically(wo.companyId, bomItem.itemCode, wo.warehouseId, stillNeeded, user.id);
                if (reservedNow > 0) {
                    await this.prisma.materialReservation.create({
                        data: {
                            companyId: wo.companyId, workOrderId, itemCode: bomItem.itemCode,
                            itemName: bomItem.itemName, warehouseId: wo.warehouseId,
                            reservedQty: reservedNow, status: 'ACTIVE',
                            createdBy: user.id, updatedBy: user.id,
                        },
                    });
                    await this.audit.log({
                        tableName: 'material_reservations', recordId: workOrderId, action: 'CREATE',
                        newValues: { workOrder: wo.woNumber, itemCode: bomItem.itemCode, reservedQty: reservedNow, requiredQty },
                        changedBy: user.id,
                    });
                }
            }
            results.push({
                itemCode: bomItem.itemCode, itemName: bomItem.itemName,
                requiredQty, reservedQty: alreadyReservedForWo + reservedNow,
                shortfallQty: Math.max(0, requiredQty - alreadyReservedForWo - reservedNow),
            });
        }
        return results;
    }
    async reserveQtyAtomically(companyId, itemCode, warehouseId, wantQty, userId) {
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const stock = await this.prisma.stockBalance.findFirst({ where: { companyId, itemCode, warehouseId } });
            if (!stock)
                return 0;
            const freeAvailable = Math.max(stock.availableQty - stock.reservedQty, 0);
            const claimQty = Math.min(freeAvailable, wantQty);
            if (claimQty <= 0.0001)
                return 0;
            const claim = await this.prisma.stockBalance.updateMany({
                where: { id: stock.id, reservedQty: stock.reservedQty },
                data: { reservedQty: { increment: claimQty }, updatedBy: userId },
            });
            if (claim.count === 1)
                return claimQty;
        }
        throw new common_1.BadRequestException(`Could not reserve stock for ${itemCode} - too many concurrent updates, please retry.`);
    }
    async releaseReservations(workOrderId, user, consumed) {
        const reason = consumed ? 'Unused reservation released on Work Order completion' : 'Work Order cancelled';
        const reservations = await this.prisma.materialReservation.findMany({
            where: { workOrderId, status: 'ACTIVE' },
        });
        for (const r of reservations) {
            const unissued = Math.max(0, r.reservedQty - r.issuedQty);
            if (unissued > 0.0001) {
                await this.prisma.stockBalance.updateMany({
                    where: { companyId: r.companyId, itemCode: r.itemCode, warehouseId: r.warehouseId },
                    data: { reservedQty: { decrement: unissued } },
                });
            }
            await this.prisma.materialReservation.update({
                where: { id: r.id },
                data: { status: 'RELEASED', releasedReason: reason, updatedBy: user.id },
            });
        }
        return { released: reservations.length };
    }
    async recordIssueAgainstReservations(workOrderId, itemCode, issuedQty, user) {
        let remaining = issuedQty;
        const reservations = await this.prisma.materialReservation.findMany({
            where: { workOrderId, itemCode, status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' },
        });
        for (const r of reservations) {
            if (remaining <= 0.0001)
                break;
            const unissued = Math.max(0, r.reservedQty - r.issuedQty);
            if (unissued <= 0.0001)
                continue;
            const take = Math.min(unissued, remaining);
            await this.prisma.materialReservation.update({
                where: { id: r.id },
                data: { issuedQty: { increment: take }, updatedBy: user.id },
            });
            remaining -= take;
        }
        return remaining;
    }
    async findForWorkOrder(workOrderId) {
        return this.prisma.materialReservation.findMany({
            where: { workOrderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAll(user, query) {
        const where = { companyId: user.companyId };
        if (query.itemCode)
            where.itemCode = query.itemCode;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.status)
            where.status = query.status;
        return this.prisma.materialReservation.findMany({
            where,
            include: { workOrder: { select: { woNumber: true, priority: true, status: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
};
exports.MaterialReservationService = MaterialReservationService;
exports.MaterialReservationService = MaterialReservationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], MaterialReservationService);
//# sourceMappingURL=material-reservation.service.js.map