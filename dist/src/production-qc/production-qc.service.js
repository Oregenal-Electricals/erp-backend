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
exports.ProductionQcService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductionQcService = class ProductionQcService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.productionQc.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PQC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true } },
            productionEntry: { select: { entryNumber: true, shift: true, goodQty: true } },
        };
    }
    async create(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const qcNumber = await this.generateNumber(user.companyId);
        const passRate = dto.sampleSize > 0 ? Math.round((dto.passQty / dto.sampleSize) * 100) : 0;
        const qc = await this.prisma.productionQc.create({
            data: {
                qcNumber, workOrderId: dto.workOrderId,
                productionEntryId: dto.productionEntryId,
                inspectionStage: dto.inspectionStage || 'IN_PROCESS',
                inspectorName: dto.inspectorName,
                inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
                sampleSize: dto.sampleSize, passQty: dto.passQty, failQty: dto.failQty,
                defectDescription: dto.defectDescription,
                correctiveAction: dto.correctiveAction,
                remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'production_qc', recordId: qc.id, action: 'CREATE', newValues: qc, changedBy: user.id });
        return Object.assign(Object.assign({}, qc), { passRate });
    }
    async complete(id, dto, user) {
        const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId } });
        if (!qc)
            throw new common_1.NotFoundException('QC record not found');
        if (qc.status === 'COMPLETED')
            throw new common_1.BadRequestException('Already completed');
        const updated = await this.prisma.productionQc.update({
            where: { id },
            data: {
                result: dto.result, status: 'COMPLETED',
                defectDescription: dto.defectDescription || qc.defectDescription,
                correctiveAction: dto.correctiveAction || qc.correctiveAction,
                remarks: dto.remarks || qc.remarks,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'production_qc', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, result, workOrderId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ qcNumber: { contains: search, mode: 'insensitive' } }];
        if (result)
            where.result = result;
        if (workOrderId)
            where.workOrderId = workOrderId;
        const [data, total] = await Promise.all([
            this.prisma.productionQc.findMany({
                where, skip, take: Number(limit), orderBy: { inspectionDate: 'desc' },
                include: this.includes(),
            }),
            this.prisma.productionQc.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const qc = await this.prisma.productionQc.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!qc)
            throw new common_1.NotFoundException('QC record not found');
        return qc;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, pending, completed, passed, failed, conditional] = await Promise.all([
            this.prisma.productionQc.count({ where }),
            this.prisma.productionQc.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            this.prisma.productionQc.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.productionQc.count({ where: Object.assign(Object.assign({}, where), { result: 'PASS' }) }),
            this.prisma.productionQc.count({ where: Object.assign(Object.assign({}, where), { result: 'FAIL' }) }),
            this.prisma.productionQc.count({ where: Object.assign(Object.assign({}, where), { result: 'CONDITIONAL' }) }),
        ]);
        const totals = await this.prisma.productionQc.aggregate({ where, _sum: { sampleSize: true, passQty: true, failQty: true } });
        const passRate = totals._sum.sampleSize > 0 ? Math.round(totals._sum.passQty / totals._sum.sampleSize * 100) : 0;
        return { total, pending, completed, passed, failed, conditional, passRate, totalSampled: totals._sum.sampleSize || 0 };
    }
};
exports.ProductionQcService = ProductionQcService;
exports.ProductionQcService = ProductionQcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProductionQcService);
//# sourceMappingURL=production-qc.service.js.map