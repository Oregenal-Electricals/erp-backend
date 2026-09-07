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
exports.ProductTargetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ProductTargetService = class ProductTargetService {
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
        const existing = await this.prisma.productStandardProductivity.findFirst({
            where: { companyId: user.companyId, productId: dto.productId, isActive: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('A target already exists for this product - use revise instead of create');
        }
        const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();
        const record = await this.prisma.productStandardProductivity.create({
            data: {
                companyId: user.companyId, productId: dto.productId,
                piecesPerManHour: dto.piecesPerManHour, effectiveFrom, effectiveTo: null,
                createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'product_standard_productivity', recordId: record.id, action: 'CREATE',
            newValues: { productId: dto.productId, piecesPerManHour: dto.piecesPerManHour, effectiveFrom },
            changedBy: user.id,
        });
        return record;
    }
    async revise(productId, dto, user) {
        const prior = await this.prisma.productStandardProductivity.findFirst({
            where: { companyId: user.companyId, productId, isActive: true },
            orderBy: { effectiveFrom: 'desc' },
            include: this.includes(),
        });
        if (!prior) {
            throw new common_1.NotFoundException('No existing target found for this product - use create to set the first target');
        }
        const newEffectiveFrom = new Date(dto.effectiveFrom);
        if (newEffectiveFrom <= prior.effectiveFrom) {
            throw new common_1.BadRequestException(`New effective date must be after the current version's effective date (${prior.effectiveFrom.toISOString().slice(0, 10)}) - a target revision cannot be backdated into an already-effective version`);
        }
        const [, created] = await this.prisma.$transaction([
            this.prisma.productStandardProductivity.update({
                where: { id: prior.id },
                data: { effectiveTo: newEffectiveFrom, updatedBy: user.id },
            }),
            this.prisma.productStandardProductivity.create({
                data: {
                    companyId: user.companyId, productId,
                    piecesPerManHour: dto.piecesPerManHour, effectiveFrom: newEffectiveFrom, effectiveTo: null,
                    createdBy: user.id, updatedBy: user.id,
                },
            }),
        ]);
        const full = await this.prisma.productStandardProductivity.findUnique({ where: { id: created.id }, include: this.includes() });
        await this.audit.log({
            tableName: 'product_standard_productivity', recordId: prior.id, action: 'UPDATE',
            oldValues: { effectiveTo: null, piecesPerManHour: prior.piecesPerManHour },
            newValues: { effectiveTo: newEffectiveFrom },
            changedBy: user.id,
        });
        await this.audit.log({
            tableName: 'product_standard_productivity', recordId: created.id, action: 'CREATE',
            newValues: { productId, piecesPerManHour: dto.piecesPerManHour, effectiveFrom: newEffectiveFrom, previousVersionId: prior.id },
            changedBy: user.id,
        });
        return full;
    }
    async findAll(user, query) {
        const where = { companyId: user.companyId };
        if (query === null || query === void 0 ? void 0 : query.productId)
            where.productId = query.productId;
        return this.prisma.productStandardProductivity.findMany({
            where, include: this.includes(),
            orderBy: [{ productId: 'asc' }, { effectiveFrom: 'desc' }],
        });
    }
    async findByProduct(productId, user) {
        return this.prisma.productStandardProductivity.findMany({
            where: { companyId: user.companyId, productId },
            include: this.includes(),
            orderBy: { effectiveFrom: 'desc' },
        });
    }
    async findCurrent(productId, user) {
        const now = new Date();
        const current = await this.prisma.productStandardProductivity.findFirst({
            where: {
                companyId: user.companyId, productId, isActive: true,
                effectiveFrom: { lte: now },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            orderBy: { effectiveFrom: 'desc' },
            include: this.includes(),
        });
        if (!current)
            throw new common_1.NotFoundException('No current target set for this product');
        return current;
    }
};
exports.ProductTargetService = ProductTargetService;
exports.ProductTargetService = ProductTargetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ProductTargetService);
//# sourceMappingURL=product-target.service.js.map