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
exports.VendorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let VendorService = class VendorService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const exists = await this.prisma.vendor.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Vendor code ${dto.code} already exists`);
        const vendor = await this.prisma.vendor.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'vendors', recordId: vendor.id, action: 'CREATE', newValues: vendor, changedBy: user.id });
        return vendor;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, vendorType, isActive } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { gstin: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        if (vendorType)
            where.vendorType = vendorType;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.vendor.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
            this.prisma.vendor.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const vendor = await this.prisma.vendor.findFirst({ where });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        return vendor;
    }
    async update(id, dto, user) {
        const vendor = await this.findOne(id, user);
        const updated = await this.prisma.vendor.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'vendors', recordId: id, action: 'UPDATE', oldValues: vendor, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const vendor = await this.findOne(id, user);
        const updated = await this.prisma.vendor.update({
            where: { id },
            data: { isActive: false, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'vendors', recordId: id, action: 'DELETE', oldValues: vendor, newValues: updated, changedBy: user.id });
        return { message: 'Vendor deactivated successfully' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, msme, suppliers, contractors] = await Promise.all([
            this.prisma.vendor.count({ where }),
            this.prisma.vendor.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
            this.prisma.vendor.count({ where: Object.assign(Object.assign({}, where), { isMsme: true, isActive: true }) }),
            this.prisma.vendor.count({ where: Object.assign(Object.assign({}, where), { vendorType: 'SUPPLIER', isActive: true }) }),
            this.prisma.vendor.count({ where: Object.assign(Object.assign({}, where), { vendorType: 'CONTRACTOR', isActive: true }) }),
        ]);
        return { total, active, inactive: total - active, msme, suppliers, contractors };
    }
};
exports.VendorService = VendorService;
exports.VendorService = VendorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], VendorService);
//# sourceMappingURL=vendor.service.js.map