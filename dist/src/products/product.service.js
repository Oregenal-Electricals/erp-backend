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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductService = class ProductService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return { category: true, uom: true };
    }
    async create(dto, user) {
        const exists = await this.prisma.product.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Product code ${dto.code} already exists`);
        const product = await this.prisma.product.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'products', recordId: product.id, action: 'CREATE', newValues: product, changedBy: user.id });
        return product;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, productType, isActive } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { hsnCode: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
            ];
        if (productType)
            where.productType = productType;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: this.includes() }),
            this.prisma.product.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const product = await this.prisma.product.findFirst({ where, include: this.includes() });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async update(id, dto, user) {
        const product = await this.findOne(id, user);
        const updated = await this.prisma.product.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'products', recordId: id, action: 'UPDATE', oldValues: product, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const product = await this.findOne(id, user);
        const updated = await this.prisma.product.update({
            where: { id },
            data: { isActive: false, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'products', recordId: id, action: 'DELETE', oldValues: product, newValues: updated, changedBy: user.id });
        return { message: 'Product deactivated successfully' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, finished, semiFin, byProduct] = await Promise.all([
            this.prisma.product.count({ where }),
            this.prisma.product.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
            this.prisma.product.count({ where: Object.assign(Object.assign({}, where), { productType: 'FINISHED_GOOD', isActive: true }) }),
            this.prisma.product.count({ where: Object.assign(Object.assign({}, where), { productType: 'SEMI_FINISHED', isActive: true }) }),
            this.prisma.product.count({ where: Object.assign(Object.assign({}, where), { productType: 'BY_PRODUCT', isActive: true }) }),
        ]);
        return { total, active, inactive: total - active, finished, semiFin, byProduct };
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProductService);
//# sourceMappingURL=product.service.js.map