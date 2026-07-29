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
exports.RcaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RcaService = class RcaService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.rcaRecord.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `RCA-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            ncr: { select: { ncrNumber: true, description: true, severity: true, source: true, itemCode: true } },
        };
    }
    async create(dto, user) {
        const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: dto.ncrId, companyId: user.companyId } });
        if (!ncr)
            throw new common_1.NotFoundException('NCR not found');
        if (ncr.status === 'CLOSED')
            throw new common_1.BadRequestException('NCR is already closed');
        const existing = await this.prisma.rcaRecord.findFirst({
            where: { ncrId: dto.ncrId, method: dto.method, companyId: user.companyId },
        });
        if (existing)
            throw new common_1.BadRequestException(`RCA with ${dto.method} method already exists for this NCR`);
        const rcaNumber = await this.generateNumber(user.companyId);
        const rca = await this.prisma.rcaRecord.create({
            data: {
                rcaNumber, ncrId: dto.ncrId, method: dto.method, problem: dto.problem,
                why1: dto.why1, why2: dto.why2, why3: dto.why3, why4: dto.why4, why5: dto.why5,
                rootCause: dto.rootCause,
                fishboneMan: dto.fishboneMan, fishboneMachine: dto.fishboneMachine,
                fishboneMaterial: dto.fishboneMaterial, fishboneMethod: dto.fishboneMethod,
                fishboneEnvironment: dto.fishboneEnvironment, fishboneMeasurement: dto.fishboneMeasurement,
                conclusion: dto.conclusion, conductedBy: dto.conductedBy, remarks: dto.remarks,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.prisma.ncrRecord.update({
            where: { id: dto.ncrId },
            data: { status: 'ROOT_CAUSE_PENDING', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rca_records', recordId: rca.id, action: 'CREATE', newValues: rca, changedBy: user.id });
        return rca;
    }
    async update(id, dto, user) {
        const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId } });
        if (!rca)
            throw new common_1.NotFoundException('RCA not found');
        if (rca.status === 'COMPLETED')
            throw new common_1.BadRequestException('Cannot edit completed RCA');
        const updated = await this.prisma.rcaRecord.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'rca_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async complete(id, user) {
        const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId } });
        if (!rca)
            throw new common_1.NotFoundException('RCA not found');
        if (!rca.conclusion && !rca.rootCause)
            throw new common_1.BadRequestException('Root cause or conclusion required before completing');
        const updated = await this.prisma.rcaRecord.update({
            where: { id }, data: { status: 'COMPLETED', updatedBy: user.id }, include: this.includes(),
        });
        await this.prisma.ncrRecord.update({
            where: { id: rca.ncrId },
            data: { status: 'CAPA_PENDING', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rca_records', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, ncrId, method, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (ncrId)
            where.ncrId = ncrId;
        if (method)
            where.method = method;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.rcaRecord.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.rcaRecord.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const rca = await this.prisma.rcaRecord.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!rca)
            throw new common_1.NotFoundException('RCA not found');
        return rca;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, completed, fiveWhy, fishbone, both] = await Promise.all([
            this.prisma.rcaRecord.count({ where }),
            this.prisma.rcaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.rcaRecord.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            this.prisma.rcaRecord.count({ where: Object.assign(Object.assign({}, where), { method: 'FIVE_WHY' }) }),
            this.prisma.rcaRecord.count({ where: Object.assign(Object.assign({}, where), { method: 'FISHBONE' }) }),
            this.prisma.rcaRecord.count({ where: Object.assign(Object.assign({}, where), { method: 'BOTH' }) }),
        ]);
        return { total, draft, completed, fiveWhy, fishbone, both };
    }
};
exports.RcaService = RcaService;
exports.RcaService = RcaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RcaService);
//# sourceMappingURL=rca.service.js.map