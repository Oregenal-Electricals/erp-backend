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
exports.ReworkService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
let ReworkService = class ReworkService {
    constructor(prisma, audit, settings) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.rework.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `RW-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true } },
            originalQcInspection: { select: { qcNumber: true } },
        };
    }
    async create(dto, user) {
        const qc = await this.prisma.productionQc.findFirst({ where: { id: dto.originalQcInspectionId, companyId: user.companyId } });
        if (!qc)
            throw new common_1.NotFoundException('Original QC inspection not found');
        if (qc.reworkQty <= 0)
            throw new common_1.BadRequestException('This QC inspection has no rework-pending quantity');
        const existingReworks = await this.prisma.rework.findMany({
            where: { companyId: user.companyId, originalQcInspectionId: dto.originalQcInspectionId, isActive: true },
        });
        const alreadyClaimed = existingReworks.reduce((sum, r) => sum + r.quantity, 0);
        const available = qc.reworkQty - alreadyClaimed;
        if (dto.quantity > available) {
            throw new common_1.BadRequestException(`Cannot create rework for ${dto.quantity} - only ${available} rework-pending quantity is available from this QC inspection`);
        }
        const reworkNumber = await this.generateNumber(user.companyId);
        const rework = await this.prisma.rework.create({
            data: {
                companyId: user.companyId, reworkNumber, workOrderId: dto.workOrderId,
                originalQcInspectionId: dto.originalQcInspectionId,
                defectDescription: dto.defectDescription, reworkStage: dto.reworkStage,
                quantity: dto.quantity, remainingQuantity: dto.quantity,
                cycleNumber: 1, status: 'REWORK_PENDING', remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'reworks', recordId: rework.id, action: 'CREATE', newValues: rework, changedBy: user.id });
        return rework;
    }
    async start(id, dto, user) {
        const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId } });
        if (!rework)
            throw new common_1.NotFoundException('Rework record not found');
        if (rework.status !== 'REWORK_PENDING')
            throw new common_1.BadRequestException(`Rework is ${rework.status}, not REWORK_PENDING`);
        const updated = await this.prisma.rework.update({
            where: { id },
            data: { status: 'IN_REWORK', manpowerQty: dto.manpowerQty, actualStartAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'reworks', recordId: id, action: 'UPDATE', newValues: { status: 'IN_REWORK' }, changedBy: user.id });
        return updated;
    }
    async complete(id, dto, user) {
        const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId }, include: { workOrder: true } });
        if (!rework)
            throw new common_1.NotFoundException('Rework record not found');
        if (rework.status !== 'IN_REWORK')
            throw new common_1.BadRequestException(`Rework is ${rework.status}, not IN_REWORK`);
        const total = dto.successfullyReworkedQty + dto.stillDefectiveQty;
        if (total !== rework.quantity) {
            if (total < rework.quantity) {
                throw new common_1.BadRequestException(`Unreconciled quantity: ${rework.quantity - total} pcs of rework input not accounted for`);
            }
            throw new common_1.BadRequestException(`Disposition total (${total}) exceeds rework input (${rework.quantity}) by ${total - rework.quantity}`);
        }
        const actualEndAt = new Date();
        let additionalLabourCost = 0;
        if (rework.actualStartAt && rework.manpowerQty) {
            const durationHours = (actualEndAt.getTime() - rework.actualStartAt.getTime()) / (1000 * 60 * 60);
            const rate = parseFloat(await this.settings.getSettingValue('STANDARD_LABOUR_RATE_PER_SHIFT', '0'));
            const shiftHours = parseFloat(await this.settings.getSettingValue('STANDARD_SHIFT_HOURS', '8')) || 8;
            if (rate > 0) {
                additionalLabourCost = Math.round(rework.manpowerQty * durationHours * (rate / shiftHours) * 100) / 100;
            }
        }
        const additionalMaterialCost = dto.additionalMaterialCost || 0;
        const additionalOtherCost = dto.additionalOtherCost || 0;
        const totalAdditionalCost = additionalLabourCost + additionalMaterialCost + additionalOtherCost;
        const updated = await this.prisma.rework.update({
            where: { id },
            data: {
                status: 'PENDING_QC_REINSPECTION',
                successfullyReworkedQty: dto.successfullyReworkedQty, stillDefectiveQty: dto.stillDefectiveQty,
                remainingQuantity: 0, actualEndAt,
                additionalLabourCost, additionalMaterialCost, additionalOtherCost, totalAdditionalCost,
                remarks: dto.remarks || rework.remarks,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        if (dto.successfullyReworkedQty > 0) {
            const qcCount = await this.prisma.productionQc.count({ where: { companyId: user.companyId } });
            const qcNumber = `QC-${new Date().getFullYear()}-${String(qcCount + 1).padStart(4, '0')}`;
            await this.prisma.productionQc.create({
                data: {
                    companyId: user.companyId, qcNumber, workOrderId: rework.workOrderId,
                    inspectionStage: 'FINAL', result: 'PENDING', status: 'PENDING',
                    sampleSize: dto.successfullyReworkedQty,
                    sourceReworkId: rework.id,
                    remarks: `Rework re-inspection - ${rework.reworkNumber}, cycle ${rework.cycleNumber}`,
                    createdBy: user.id, updatedBy: user.id,
                },
            });
        }
        await this.audit.log({
            tableName: 'reworks', recordId: id, action: 'UPDATE',
            newValues: { status: 'PENDING_QC_REINSPECTION', successfullyReworkedQty: dto.successfullyReworkedQty, stillDefectiveQty: dto.stillDefectiveQty, totalAdditionalCost },
            changedBy: user.id,
        });
        return updated;
    }
    async findAll(user, query) {
        const { workOrderId, status } = query;
        const where = { companyId: user.companyId, isActive: true };
        if (workOrderId)
            where.workOrderId = workOrderId;
        if (status)
            where.status = status;
        return this.prisma.rework.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, user) {
        const rework = await this.prisma.rework.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!rework)
            throw new common_1.NotFoundException('Rework record not found');
        return rework;
    }
};
exports.ReworkService = ReworkService;
exports.ReworkService = ReworkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, settings_service_1.SettingsService])
], ReworkService);
//# sourceMappingURL=rework.service.js.map