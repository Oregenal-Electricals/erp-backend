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
exports.RawMaterialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RawMaterialService = class RawMaterialService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return { category: true, uom: true };
    }
    async create(dto, user) {
        const exists = await this.prisma.rawMaterial.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Raw material code ${dto.code} already exists`);
        const rm = await this.prisma.rawMaterial.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'raw_materials', recordId: rm.id, action: 'CREATE', newValues: rm, changedBy: user.id });
        return rm;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, materialType, isActive } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { partNumber: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { hsnCode: { contains: search, mode: 'insensitive' } },
            ];
        if (materialType)
            where.materialType = materialType;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.rawMaterial.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
            this.prisma.rawMaterial.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const rm = await this.prisma.rawMaterial.findFirst({ where, include: this.includes() });
        if (!rm)
            throw new common_1.NotFoundException('Raw material not found');
        return rm;
    }
    async update(id, dto, user) {
        const rm = await this.findOne(id, user);
        const updated = await this.prisma.rawMaterial.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'raw_materials', recordId: id, action: 'UPDATE', oldValues: rm, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const rm = await this.findOne(id, user);
        const updated = await this.prisma.rawMaterial.update({
            where: { id },
            data: { isActive: false, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'raw_materials', recordId: id, action: 'DELETE', oldValues: rm, newValues: updated, changedBy: user.id });
        return { message: 'Raw material deactivated successfully' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, electronic, mechanical, electrical, packaging] = await Promise.all([
            this.prisma.rawMaterial.count({ where }),
            this.prisma.rawMaterial.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
            this.prisma.rawMaterial.count({ where: Object.assign(Object.assign({}, where), { materialType: 'ELECTRONIC', isActive: true }) }),
            this.prisma.rawMaterial.count({ where: Object.assign(Object.assign({}, where), { materialType: 'MECHANICAL', isActive: true }) }),
            this.prisma.rawMaterial.count({ where: Object.assign(Object.assign({}, where), { materialType: 'ELECTRICAL', isActive: true }) }),
            this.prisma.rawMaterial.count({ where: Object.assign(Object.assign({}, where), { materialType: 'PACKAGING', isActive: true }) }),
        ]);
        return { total, active, inactive: total - active, electronic, mechanical, electrical, packaging };
    }
};
exports.RawMaterialService = RawMaterialService;
exports.RawMaterialService = RawMaterialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RawMaterialService);
//# sourceMappingURL=raw-material.service.js.map