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
exports.ProductSellingPriceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductSellingPriceService = class ProductSellingPriceService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    includes() {
        return { product: { select: { id: true, code: true, name: true } } };
    }
    async create(dto, user) {
        const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const existing = await this.prisma.productSellingPrice.findFirst({
            where: { companyId: user.companyId, productId: dto.productId, isActive: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('A selling price already exists for this product - use revise instead of create');
        }
        const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();
        const record = await this.prisma.productSellingPrice.create({
            data: {
                companyId: user.companyId, productId: dto.productId,
                sellingPrice: dto.sellingPrice, effectiveFrom, effectiveTo: null,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'product_selling_prices', recordId: record.id, action: 'CREATE',
            newValues: { productId: dto.productId, sellingPrice: dto.sellingPrice, effectiveFrom },
            changedBy: user.id,
        });
        return record;
    }
    async revise(productId, dto, user) {
        const prior = await this.prisma.productSellingPrice.findFirst({
            where: { companyId: user.companyId, productId, isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            include: this.includes(),
        });
        if (!prior) {
            throw new common_1.NotFoundException('No existing selling price found for this product - use create to set the first price');
        }
        const newEffectiveFrom = new Date(dto.effectiveFrom);
        if (newEffectiveFrom <= prior.effectiveFrom) {
            throw new common_1.BadRequestException(`New effective date must be after the current version's effective date (${prior.effectiveFrom.toISOString().slice(0, 10)}) - a price revision cannot be backdated into an already-effective version`);
        }
        const [, created] = await this.prisma.$transaction([
            this.prisma.productSellingPrice.update({
                where: { id: prior.id },
                data: { effectiveTo: newEffectiveFrom, updatedBy: user.id },
            }),
            this.prisma.productSellingPrice.create({
                data: {
                    companyId: user.companyId, productId,
                    sellingPrice: dto.sellingPrice, effectiveFrom: newEffectiveFrom, effectiveTo: null,
                    createdBy: user.id, updatedBy: user.id,
                },
            }),
        ]);
        const full = await this.prisma.productSellingPrice.findUnique({ where: { id: created.id }, include: this.includes() });
        await this.audit.log({
            tableName: 'product_selling_prices', recordId: prior.id, action: 'UPDATE',
            oldValues: { effectiveTo: null, sellingPrice: prior.sellingPrice },
            newValues: { effectiveTo: newEffectiveFrom },
            changedBy: user.id,
        });
        await this.audit.log({
            tableName: 'product_selling_prices', recordId: created.id, action: 'CREATE',
            newValues: { productId, sellingPrice: dto.sellingPrice, effectiveFrom: newEffectiveFrom, previousVersionId: prior.id },
            changedBy: user.id,
        });
        return full;
    }
    async findAll(user, query) {
        const where = { companyId: user.companyId };
        if (query === null || query === void 0 ? void 0 : query.productId)
            where.productId = query.productId;
        return this.prisma.productSellingPrice.findMany({
            where, include: this.includes(),
            orderBy: [{ productId: 'asc' }, { effectiveFrom: 'desc' }],
        });
    }
    async findByProduct(productId, user) {
        return this.prisma.productSellingPrice.findMany({
            where: { companyId: user.companyId, productId },
            include: this.includes(),
            orderBy: { effectiveFrom: 'desc' },
        });
    }
    async findCurrent(productId, user) {
        const now = new Date();
        const current = await this.prisma.productSellingPrice.findFirst({
            where: {
                companyId: user.companyId, productId, isActive: true,
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            orderBy: { effectiveFrom: 'desc' },
            include: this.includes(),
        });
        if (!current)
            throw new common_1.NotFoundException('No current selling price set for this product');
        return current;
    }
};
exports.ProductSellingPriceService = ProductSellingPriceService;
exports.ProductSellingPriceService = ProductSellingPriceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProductSellingPriceService);
//# sourceMappingURL=product-selling-price.service.js.map