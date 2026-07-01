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
exports.OqcService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let OqcService = class OqcService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.oqcInspection.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `OQC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productName: true } },
            fgReceipt: { select: { receiptNumber: true, receivedQty: true } },
        };
    }
    async create(dto, user) {
        const oqcNumber = await this.generateNumber(user.companyId);
        const passRate = dto.sampleSize > 0 ? Math.round(dto.passQty / dto.sampleSize * 100) : 0;
        let result = dto.result || 'PENDING';
        if (!dto.result && dto.sampleSize > 0) {
            if (dto.failQty === 0)
                result = 'PASS';
            else if (dto.failQty / dto.sampleSize > 0.1)
                result = 'FAIL';
            else
                result = 'CONDITIONAL';
        }
        const oqc = await this.prisma.oqcInspection.create({
            data: {
                oqcNumber, fgReceiptId: dto.fgReceiptId, workOrderId: dto.workOrderId,
                itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom || 'PCS',
                customerName: dto.customerName, lotNumber: dto.lotNumber, batchNumber: dto.batchNumber,
                inspectorName: dto.inspectorName,
                inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : new Date(),
                sampleSize: dto.sampleSize, passQty: dto.passQty, failQty: dto.failQty,
                visualCheck: dto.visualCheck, dimensionalCheck: dto.dimensionalCheck,
                functionalCheck: dto.functionalCheck, packagingCheck: dto.packagingCheck,
                labellingCheck: dto.labellingCheck,
                result, defectsFound: dto.defectsFound, cocNumber: dto.cocNumber,
                status: result === 'PENDING' ? 'PENDING' : 'COMPLETED',
                remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'oqc_inspections', recordId: oqc.id, action: 'CREATE', newValues: oqc, changedBy: user.id });
        return Object.assign(Object.assign({}, oqc), { passRate });
    }
    async complete(id, dto, user) {
        const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId } });
        if (!oqc)
            throw new common_1.NotFoundException('OQC record not found');
        if (oqc.status === 'RELEASED')
            throw new common_1.BadRequestException('Already released');
        const updated = await this.prisma.oqcInspection.update({
            where: { id },
            data: {
                result: dto.result, defectsFound: dto.defectsFound,
                cocNumber: dto.cocNumber, remarks: dto.remarks,
                status: 'COMPLETED', updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'oqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async release(id, user) {
        const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId } });
        if (!oqc)
            throw new common_1.NotFoundException('OQC record not found');
        if (oqc.result !== 'PASS')
            throw new common_1.BadRequestException('Only PASS inspections can be released for dispatch');
        if (oqc.status !== 'COMPLETED')
            throw new common_1.BadRequestException('Complete inspection before release');
        const updated = await this.prisma.oqcInspection.update({
            where: { id },
            data: { status: 'RELEASED', releasedBy: user.id, releasedDate: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'oqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, result, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { oqcNumber: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        if (result)
            where.result = result;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.oqcInspection.findMany({
                where, skip, take: Number(limit), orderBy: { inspectionDate: 'desc' },
                include: this.includes(),
            }),
            this.prisma.oqcInspection.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const oqc = await this.prisma.oqcInspection.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!oqc)
            throw new common_1.NotFoundException('OQC record not found');
        return oqc;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, pending, completed, released, pass, fail, conditional] = await Promise.all([
            this.prisma.oqcInspection.count({ where }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'RELEASED' }) }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { result: 'PASS' }) }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { result: 'FAIL' }) }),
            this.prisma.oqcInspection.count({ where: Object.assign(Object.assign({}, where), { result: 'CONDITIONAL' }) }),
        ]);
        const totals = await this.prisma.oqcInspection.aggregate({
            where, _sum: { sampleSize: true, passQty: true, failQty: true },
        });
        const passRate = totals._sum.sampleSize > 0 ? Math.round(totals._sum.passQty / totals._sum.sampleSize * 100) : 0;
        return { total, pending, completed, released, pass, fail, conditional, passRate, totalSampled: totals._sum.sampleSize || 0 };
    }
};
exports.OqcService = OqcService;
exports.OqcService = OqcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], OqcService);
//# sourceMappingURL=oqc.service.js.map