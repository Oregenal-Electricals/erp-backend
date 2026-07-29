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
exports.HsnSacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let HsnSacService = class HsnSacService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const exists = await this.prisma.hsnSacCode.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code } },
        });
        if (exists)
            throw new common_1.ConflictException(`HSN/SAC code ${dto.code} already exists`);
        const half = dto.gstRate / 2;
        const record = await this.prisma.hsnSacCode.create({
            data: Object.assign(Object.assign({}, dto), { igstRate: dto.gstRate, cgstRate: half, sgstRate: half, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'hsn_sac_codes', recordId: record.id, action: 'CREATE', newValues: record, changedBy: user.id });
        return record;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, codeType, isActive } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        if (codeType)
            where.codeType = codeType;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.hsnSacCode.findMany({ where, skip, take: Number(limit), orderBy: { code: 'asc' } }),
            this.prisma.hsnSacCode.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const record = await this.prisma.hsnSacCode.findFirst({ where });
        if (!record)
            throw new common_1.NotFoundException('HSN/SAC code not found');
        return record;
    }
    async update(id, dto, user) {
        const record = await this.findOne(id, user);
        const updateData = Object.assign(Object.assign({}, dto), { updatedBy: user.id });
        if (dto.gstRate !== undefined) {
            updateData.igstRate = dto.gstRate;
            updateData.cgstRate = dto.gstRate / 2;
            updateData.sgstRate = dto.gstRate / 2;
        }
        const updated = await this.prisma.hsnSacCode.update({ where: { id }, data: updateData });
        await this.audit.log({ tableName: 'hsn_sac_codes', recordId: id, action: 'UPDATE', oldValues: record, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const record = await this.findOne(id, user);
        const updated = await this.prisma.hsnSacCode.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'hsn_sac_codes', recordId: id, action: 'DELETE', oldValues: record, newValues: updated, changedBy: user.id });
        return { message: 'HSN/SAC code deactivated successfully' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, hsn, sac, zeroRated, standard] = await Promise.all([
            this.prisma.hsnSacCode.count({ where }),
            this.prisma.hsnSacCode.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
            this.prisma.hsnSacCode.count({ where: Object.assign(Object.assign({}, where), { codeType: 'HSN', isActive: true }) }),
            this.prisma.hsnSacCode.count({ where: Object.assign(Object.assign({}, where), { codeType: 'SAC', isActive: true }) }),
            this.prisma.hsnSacCode.count({ where: Object.assign(Object.assign({}, where), { gstRate: 0, isActive: true }) }),
            this.prisma.hsnSacCode.count({ where: Object.assign(Object.assign({}, where), { gstRate: 18, isActive: true }) }),
        ]);
        return { total, active, inactive: total - active, hsn, sac, zeroRated, standard };
    }
};
exports.HsnSacService = HsnSacService;
exports.HsnSacService = HsnSacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], HsnSacService);
//# sourceMappingURL=hsn-sac.service.js.map