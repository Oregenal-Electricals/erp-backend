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
exports.NcrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let NcrService = class NcrService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.ncrRecord.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `NCR-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productName: true } },
            capaRecords: { select: { id: true, capaNumber: true, status: true, assignedTo: true, dueDate: true } },
        };
    }
    async create(dto, user) {
        const ncrNumber = await this.generateNumber(user.companyId);
        const ncr = await this.prisma.ncrRecord.create({
            data: {
                ncrNumber, source: dto.source,
                sourceReferenceId: dto.sourceReferenceId,
                sourceReferenceNumber: dto.sourceReferenceNumber,
                itemCode: dto.itemCode, itemName: dto.itemName,
                workOrderId: dto.workOrderId,
                description: dto.description, severity: dto.severity,
                qtyAffected: dto.qtyAffected || 0,
                detectedBy: dto.detectedBy,
                detectedDate: dto.detectedDate ? new Date(dto.detectedDate) : new Date(),
                disposition: dto.disposition, remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'ncr_records', recordId: ncr.id, action: 'CREATE', newValues: ncr, changedBy: user.id });
        return ncr;
    }
    async update(id, dto, user) {
        const ncr = await this.prisma.ncrRecord.findFirst({ where: { id, companyId: user.companyId } });
        if (!ncr)
            throw new common_1.NotFoundException('NCR not found');
        if (ncr.status === 'CLOSED')
            throw new common_1.BadRequestException('Cannot edit closed NCR');
        const updated = await this.prisma.ncrRecord.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'ncr_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async close(id, user) {
        const ncr = await this.prisma.ncrRecord.findFirst({
            where: { id, companyId: user.companyId },
            include: { capaRecords: true },
        });
        if (!ncr)
            throw new common_1.NotFoundException('NCR not found');
        if (ncr.status === 'CLOSED')
            throw new common_1.BadRequestException('Already closed');
        const openCapas = ncr.capaRecords.filter(c => !['COMPLETED', 'VERIFIED'].includes(c.status));
        if (openCapas.length > 0)
            throw new common_1.BadRequestException(`${openCapas.length} CAPA(s) still open. Complete them first.`);
        const updated = await this.prisma.ncrRecord.update({
            where: { id },
            data: { status: 'CLOSED', closedDate: new Date(), closedBy: user.id, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'ncr_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, severity, source } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { ncrNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        if (source)
            where.source = source;
        const [data, total] = await Promise.all([
            this.prisma.ncrRecord.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { capaRecords: { select: { id: true, status: true } }, workOrder: { select: { woNumber: true } } },
            }),
            this.prisma.ncrRecord.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const ncr = await this.prisma.ncrRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!ncr)
            throw new common_1.NotFoundException('NCR not found');
        return ncr;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, open, capaPending, closed, critical, major, minor] = await Promise.all([
            this.prisma.ncrRecord.count({ where }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'OPEN' }) }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'CAPA_PENDING' }) }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { severity: 'CRITICAL' }) }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { severity: 'MAJOR' }) }),
            this.prisma.ncrRecord.count({ where: Object.assign(Object.assign({}, where), { severity: 'MINOR' }) }),
        ]);
        return { total, open, capaPending, closed, critical, major, minor };
    }
};
exports.NcrService = NcrService;
exports.NcrService = NcrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], NcrService);
//# sourceMappingURL=ncr.service.js.map