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
exports.ScrapService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ScrapService = class ScrapService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.scrap.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `FR-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true } },
            sourceQcInspection: { select: { qcNumber: true } },
            sourceRework: { select: { reworkNumber: true, cycleNumber: true } },
        };
    }
    async create(dto, user) {
        const qc = await this.prisma.productionQc.findFirst({ where: { id: dto.sourceQcInspectionId, companyId: user.companyId } });
        if (!qc)
            throw new common_1.NotFoundException('Source QC inspection not found');
        if (qc.failQty <= 0)
            throw new common_1.BadRequestException('This QC inspection has no rejected quantity');
        const existingScraps = await this.prisma.scrap.findMany({
            where: { companyId: user.companyId, sourceQcInspectionId: dto.sourceQcInspectionId, isActive: true },
        });
        const alreadyClaimed = existingScraps.reduce((sum, s) => sum + s.quantity, 0);
        const available = qc.failQty - alreadyClaimed;
        if (dto.quantity > available) {
            throw new common_1.BadRequestException(`Cannot create final rejection for ${dto.quantity} - only ${available} rejected quantity is available from this QC inspection`);
        }
        const rejectionNumber = await this.generateNumber(user.companyId);
        const scrap = await this.prisma.scrap.create({
            data: {
                companyId: user.companyId, rejectionNumber, workOrderId: dto.workOrderId,
                sourceQcInspectionId: dto.sourceQcInspectionId, sourceReworkId: dto.sourceReworkId,
                defectDescription: dto.defectDescription, quantity: dto.quantity,
                status: 'PENDING_DISPOSITION', remarks: dto.remarks,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'scraps', recordId: scrap.id, action: 'CREATE', newValues: scrap, changedBy: user.id });
        return scrap;
    }
    async disposition(id, dto, user) {
        const scrap = await this.prisma.scrap.findFirst({ where: { id, companyId: user.companyId } });
        if (!scrap)
            throw new common_1.NotFoundException('Final rejection record not found');
        if (scrap.status === 'DISPOSITION_COMPLETED')
            throw new common_1.BadRequestException('This final rejection has already been fully dispositioned');
        const otherDispositionQty = dto.otherDispositionQty || 0;
        const newTotal = scrap.scrapQty + scrap.recoveryQty + scrap.otherDispositionQty + dto.scrapQty + dto.recoveryQty + otherDispositionQty;
        if (newTotal > scrap.quantity) {
            throw new common_1.BadRequestException(`Disposition total (${newTotal}) exceeds final rejection quantity (${scrap.quantity}) by ${newTotal - scrap.quantity}`);
        }
        const updatedScrapQty = scrap.scrapQty + dto.scrapQty;
        const updatedRecoveryQty = scrap.recoveryQty + dto.recoveryQty;
        const updatedOtherQty = scrap.otherDispositionQty + otherDispositionQty;
        const pendingDisposition = scrap.quantity - (updatedScrapQty + updatedRecoveryQty + updatedOtherQty);
        const updated = await this.prisma.scrap.update({
            where: { id },
            data: {
                scrapQty: updatedScrapQty, recoveryQty: updatedRecoveryQty, otherDispositionQty: updatedOtherQty,
                status: pendingDisposition === 0 ? 'DISPOSITION_COMPLETED' : 'PENDING_DISPOSITION',
                estimatedScrapValue: dto.estimatedScrapValue !== undefined ? dto.estimatedScrapValue : scrap.estimatedScrapValue,
                recognizedScrapRecovery: scrap.recognizedScrapRecovery + (dto.recognizedScrapRecovery || 0),
                recoveredComponents: dto.recoveredComponents || scrap.recoveredComponents,
                remarks: dto.remarks || scrap.remarks,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'scraps', recordId: id, action: 'UPDATE',
            newValues: { scrapQty: updatedScrapQty, recoveryQty: updatedRecoveryQty, otherDispositionQty: updatedOtherQty, recognizedScrapRecovery: updated.recognizedScrapRecovery },
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
        return this.prisma.scrap.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, user) {
        const scrap = await this.prisma.scrap.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!scrap)
            throw new common_1.NotFoundException('Final rejection record not found');
        return scrap;
    }
};
exports.ScrapService = ScrapService;
exports.ScrapService = ScrapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ScrapService);
//# sourceMappingURL=scrap.service.js.map