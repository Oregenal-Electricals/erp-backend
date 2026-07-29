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
exports.BomRevisionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let BomRevisionService = class BomRevisionService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const bom = await this.prisma.bom.findFirst({ where: { id: dto.bomId, companyId: user.companyId } });
        if (!bom)
            throw new common_1.NotFoundException('BOM not found');
        if (bom.productId !== dto.productId)
            throw new common_1.BadRequestException('BOM does not belong to this product');
        const exists = await this.prisma.bomRevision.findUnique({
            where: { companyId_productId_revisionNumber: { companyId: user.companyId, productId: dto.productId, revisionNumber: dto.revisionNumber } },
        });
        if (exists)
            throw new common_1.ConflictException(`Revision ${dto.revisionNumber} already exists for this product`);
        const rev = await this.prisma.bomRevision.create({
            data: Object.assign(Object.assign({}, dto), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: {
                product: { select: { code: true, name: true } },
                bom: { select: { bomNumber: true, version: true, status: true } },
                previousBom: { select: { bomNumber: true, version: true } },
            },
        });
        await this.audit.log({ tableName: 'bom_revisions', recordId: rev.id, action: 'CREATE', newValues: rev, changedBy: user.id });
        return rev;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, productId, changeType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { revisionNumber: { contains: search, mode: 'insensitive' } },
                { ecnNumber: { contains: search, mode: 'insensitive' } },
                { changeDescription: { contains: search, mode: 'insensitive' } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
                { product: { code: { contains: search, mode: 'insensitive' } } },
            ];
        if (status)
            where.status = status;
        if (productId)
            where.productId = productId;
        if (changeType)
            where.changeType = changeType;
        const [data, total] = await Promise.all([
            this.prisma.bomRevision.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { code: true, name: true } },
                    bom: { select: { bomNumber: true, version: true, status: true } },
                    previousBom: { select: { bomNumber: true, version: true } },
                },
            }),
            this.prisma.bomRevision.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const rev = await this.prisma.bomRevision.findFirst({
            where,
            include: {
                product: { select: { code: true, name: true } },
                bom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
                previousBom: { include: { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } } },
            },
        });
        if (!rev)
            throw new common_1.NotFoundException('BOM revision not found');
        return rev;
    }
    async findByProduct(productId, user) {
        const where = { productId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.bomRevision.findMany({
            where, orderBy: { effectiveDate: 'desc' },
            include: {
                product: { select: { code: true, name: true } },
                bom: { select: { bomNumber: true, version: true, status: true } },
                previousBom: { select: { bomNumber: true, version: true } },
            },
        });
    }
    async approve(id, user) {
        const rev = await this.findOne(id, user);
        if (rev.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT revisions can be approved');
        const updated = await this.prisma.bomRevision.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: {
                product: { select: { code: true, name: true } },
                bom: { select: { bomNumber: true, version: true, status: true } },
            },
        });
        await this.audit.log({ tableName: 'bom_revisions', recordId: id, action: 'UPDATE', oldValues: rev, newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, approved, major, minor, patch] = await Promise.all([
            this.prisma.bomRevision.count({ where }),
            this.prisma.bomRevision.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.bomRevision.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.bomRevision.count({ where: Object.assign(Object.assign({}, where), { changeType: 'MAJOR' }) }),
            this.prisma.bomRevision.count({ where: Object.assign(Object.assign({}, where), { changeType: 'MINOR' }) }),
            this.prisma.bomRevision.count({ where: Object.assign(Object.assign({}, where), { changeType: 'PATCH' }) }),
        ]);
        return { total, draft, approved, major, minor, patch };
    }
};
exports.BomRevisionService = BomRevisionService;
exports.BomRevisionService = BomRevisionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], BomRevisionService);
//# sourceMappingURL=bom-revision.service.js.map