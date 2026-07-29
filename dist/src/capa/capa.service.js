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
exports.CapaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CapaService = class CapaService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.capaRecord.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ncr: { select: { ncrNumber: true, description: true, severity: true, source: true } },
        };
    }
    async create(dto, user) {
        const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: dto.ncrId, companyId: user.companyId } });
        if (!ncr)
            throw new common_1.NotFoundException('NCR not found');
        if (ncr.status === 'CLOSED')
            throw new common_1.BadRequestException('NCR is already closed');
        const capaNumber = await this.generateNumber(user.companyId);
        const capa = await this.prisma.capaRecord.create({
            data: {
                capaNumber, ncrId: dto.ncrId,
                rootCause: dto.rootCause, correctiveAction: dto.correctiveAction,
                preventiveAction: dto.preventiveAction, assignedTo: dto.assignedTo,
                dueDate: new Date(dto.dueDate), remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.ncrRecord.update({
            where: { id: dto.ncrId },
            data: { status: 'CAPA_PENDING', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'capa_records', recordId: capa.id, action: 'CREATE', newValues: capa, changedBy: user.id });
        return capa;
    }
    async update(id, dto, user) {
        const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId } });
        if (!capa)
            throw new common_1.NotFoundException('CAPA not found');
        if (capa.status === 'VERIFIED')
            throw new common_1.BadRequestException('Cannot edit verified CAPA');
        const updateData = Object.assign(Object.assign({}, dto), { updatedBy: user.id });
        if (dto.dueDate)
            updateData.dueDate = new Date(dto.dueDate);
        if (dto.status === 'COMPLETED')
            updateData.completedDate = new Date();
        const updated = await this.prisma.capaRecord.update({
            where: { id }, data: updateData, include: this.includes(),
        });
        await this.audit.log({ tableName: 'capa_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async verify(id, dto, user) {
        const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId } });
        if (!capa)
            throw new common_1.NotFoundException('CAPA not found');
        if (capa.status !== 'COMPLETED')
            throw new common_1.BadRequestException('CAPA must be COMPLETED before verification');
        const updated = await this.prisma.capaRecord.update({
            where: { id },
            data: {
                status: 'VERIFIED', effectivenessCheck: dto.effectivenessCheck,
                verifiedBy: user.id, verifiedDate: new Date(), updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.ncrRecord.update({
            where: { id: capa.ncrId },
            data: { status: 'VERIFICATION_PENDING', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'capa_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, status, ncrId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (status)
            where.status = status;
        if (ncrId)
            where.ncrId = ncrId;
        const [data, total] = await Promise.all([
            this.prisma.capaRecord.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.capaRecord.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const capa = await this.prisma.capaRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!capa)
            throw new common_1.NotFoundException('CAPA not found');
        return capa;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, assigned, inProgress, completed, verified, overdue] = await Promise.all([
            this.prisma.capaRecord.count({ where }),
            this.prisma.capaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'ASSIGNED' }) }),
            this.prisma.capaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.capaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.capaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'VERIFIED' }) }),
            this.prisma.capaRecord.count({ where: Object.assign(Object.assign({}, where), { status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } }) }),
        ]);
        return { total, assigned, inProgress, completed, verified, overdue };
    }
};
exports.CapaService = CapaService;
exports.CapaService = CapaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CapaService);
//# sourceMappingURL=capa.service.js.map