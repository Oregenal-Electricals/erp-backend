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
exports.ProductFamilyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductFamilyService = class ProductFamilyService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return {
            products: {
                where: { isActive: true },
                select: { id: true, code: true, name: true, productType: true, isActive: true },
            },
        };
    }
    async create(dto, user) {
        const exists = await this.prisma.productFamily.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Product Family code ${dto.code} already exists`);
        const family = await this.prisma.productFamily.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'product_families', recordId: family.id, action: 'CREATE', newValues: family, changedBy: user.id });
        return family;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, isActive } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.productFamily.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
            this.prisma.productFamily.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const family = await this.prisma.productFamily.findFirst({ where, include: this.includes() });
        if (!family)
            throw new common_1.NotFoundException('Product Family not found');
        return family;
    }
    async update(id, dto, user) {
        const family = await this.findOne(id, user);
        const updated = await this.prisma.productFamily.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'product_families', recordId: id, action: 'UPDATE', oldValues: family, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const family = await this.findOne(id, user);
        const updated = await this.prisma.productFamily.update({
            where: { id },
            data: { isActive: false, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'product_families', recordId: id, action: 'DELETE', oldValues: family, newValues: updated, changedBy: user.id });
        return { message: 'Product Family deactivated successfully' };
    }
    async assignProducts(id, dto, user) {
        const family = await this.findOne(id, user);
        if (!dto.productIds || dto.productIds.length === 0) {
            throw new common_1.BadRequestException('productIds must be a non-empty array');
        }
        const matchingProducts = await this.prisma.product.findMany({
            where: { id: { in: dto.productIds }, companyId: family.companyId },
            select: { id: true },
        });
        if (matchingProducts.length !== dto.productIds.length) {
            throw new common_1.BadRequestException('One or more productIds do not exist in this company');
        }
        await this.prisma.product.updateMany({
            where: { id: { in: dto.productIds }, companyId: family.companyId },
            data: { familyId: family.id, updatedBy: user.id },
        });
        await this.audit.log({
            tableName: 'products', recordId: family.id, action: 'UPDATE',
            newValues: { familyId: family.id, assignedProductIds: dto.productIds },
            changedBy: user.id, reason: `Assigned to Product Family ${family.code}`,
        });
        return this.findOne(id, user);
    }
    async removeProduct(productId, user) {
        const where = { id: productId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const product = await this.prisma.product.findFirst({ where });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (!product.familyId)
            throw new common_1.BadRequestException('Product is not assigned to any Product Family');
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: { familyId: null, updatedBy: user.id },
        });
        await this.audit.log({
            tableName: 'products', recordId: productId, action: 'UPDATE',
            oldValues: { familyId: product.familyId }, newValues: { familyId: null },
            changedBy: user.id, reason: 'Removed from Product Family',
        });
        return updated;
    }
};
exports.ProductFamilyService = ProductFamilyService;
exports.ProductFamilyService = ProductFamilyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProductFamilyService);
//# sourceMappingURL=product-family.service.js.map