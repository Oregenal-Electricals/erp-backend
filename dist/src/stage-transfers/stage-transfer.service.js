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
exports.StageTransferService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const SUPERVISOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN', 'PLANT_HEAD', 'UNIT_HEAD', 'PLANNING_MANAGER'];
let StageTransferService = class StageTransferService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            fromWorkOrder: { select: { id: true, woNumber: true, stageName: true, productCode: true, productName: true } },
            toWorkOrder: { select: { id: true, woNumber: true, stageName: true, productCode: true, productName: true } },
            givenBy: { select: { firstName: true, lastName: true } },
            receivedBy: { select: { firstName: true, lastName: true } },
        };
    }
    async give(dto, user) {
        var _a;
        const fromWo = await this.prisma.workOrder.findFirst({ where: { id: dto.fromWorkOrderId, companyId: user.companyId } });
        if (!fromWo)
            throw new common_1.NotFoundException('Source Work Order not found');
        if (!['IN_PROGRESS', 'COMPLETED'].includes(fromWo.status)) {
            throw new common_1.BadRequestException('Only a Work Order that is IN PRODUCTION or COMPLETED has output to give');
        }
        const toWo = await this.prisma.workOrder.findFirst({ where: { id: dto.toWorkOrderId, companyId: user.companyId } });
        if (!toWo)
            throw new common_1.NotFoundException('Destination Work Order not found');
        if (fromWo.routingGroupId && toWo.routingGroupId === fromWo.routingGroupId) {
            if (toWo.parentWorkOrderId !== fromWo.id) {
                throw new common_1.BadRequestException(`${toWo.woNumber} is not the immediate next stage after ${fromWo.woNumber} in this routing - handover would skip a stage`);
            }
        }
        const transferable = fromWo.completedQty - fromWo.cumulativeHandoverQty;
        const qty = (_a = dto.qty) !== null && _a !== void 0 ? _a : transferable;
        if (qty <= 0)
            throw new common_1.BadRequestException('No transferable quantity available to hand over');
        if (qty > transferable) {
            throw new common_1.BadRequestException(`Cannot give ${qty} - only ${transferable} is transferable (${fromWo.completedQty} completed minus ${fromWo.cumulativeHandoverQty} already given)`);
        }
        const updated = await this.prisma.$executeRaw `
      UPDATE work_orders SET "cumulativeHandoverQty" = "cumulativeHandoverQty" + ${qty}, "updatedBy" = ${user.id}
      WHERE id = ${fromWo.id} AND "completedQty" - "cumulativeHandoverQty" >= ${qty}
    `;
        if (updated === 0) {
            throw new common_1.BadRequestException('Transferable quantity changed since this was checked - please retry');
        }
        const note = await this.prisma.stageTransferNote.create({
            data: {
                companyId: user.companyId,
                fromWorkOrderId: dto.fromWorkOrderId, toWorkOrderId: dto.toWorkOrderId,
                itemCode: fromWo.productCode, itemName: fromWo.productName,
                qty, remarks: dto.remarks,
                givenByUserId: user.id,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.workOrder.update({
            where: { id: toWo.id },
            data: {
                cumulativeInputQty: { increment: qty },
                stageStatus: toWo.stageStatus === 'NOT_READY' ? 'READY_FOR_START' : toWo.stageStatus,
                updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'stage_transfer_notes', recordId: note.id, action: 'CREATE', newValues: note, changedBy: user.id });
        return note;
    }
    async receive(id, user) {
        const note = await this.prisma.stageTransferNote.findFirst({ where: { id, companyId: user.companyId } });
        if (!note)
            throw new common_1.NotFoundException('Transfer note not found');
        if (note.status === 'RECEIVED')
            throw new common_1.BadRequestException('This transfer has already been received');
        const updated = await this.prisma.stageTransferNote.update({
            where: { id },
            data: { status: 'RECEIVED', receivedByUserId: user.id, receivedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'stage_transfer_notes', recordId: id, action: 'UPDATE', newValues: { status: 'RECEIVED' }, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { status, pending } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (status)
            where.status = status;
        if (pending === 'true')
            where.status = 'PENDING';
        if (!SUPERVISOR_ROLES.includes(user.role)) {
            where.OR = [
                { givenByUserId: user.id },
                { receivedByUserId: user.id },
                { fromWorkOrder: { stageName: user.assignedStage || '__none__' } },
                { toWorkOrder: { stageName: user.assignedStage || '__none__' } },
            ];
        }
        return this.prisma.stageTransferNote.findMany({
            where, include: this.includes(), orderBy: { givenAt: 'desc' },
        });
    }
};
exports.StageTransferService = StageTransferService;
exports.StageTransferService = StageTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], StageTransferService);
//# sourceMappingURL=stage-transfer.service.js.map