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
exports.BomService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let BomService = class BomService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    itemIncludes() {
        return { items: { where: { isActive: true }, orderBy: { sequence: 'asc' } } };
    }
    async generateBomNumber(companyId) {
        const count = await this.prisma.bom.count({ where: { companyId } });
        return `BOM-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto, user) {
        const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: user.companyId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const bomNumber = await this.generateBomNumber(user.companyId);
        const bom = await this.prisma.bom.create({
            data: Object.assign(Object.assign({}, dto), { bomNumber, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: Object.assign({ product: { select: { code: true, name: true } } }, this.itemIncludes()),
        });
        await this.audit.log({ tableName: 'boms', recordId: bom.id, action: 'CREATE', newValues: bom, changedBy: user.id });
        return bom;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, productId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { bomNumber: { contains: search, mode: 'insensitive' } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
                { product: { code: { contains: search, mode: 'insensitive' } } },
            ];
        if (status)
            where.status = status;
        if (productId)
            where.productId = productId;
        const [data, total] = await Promise.all([
            this.prisma.bom.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { product: { select: { code: true, name: true } }, _count: { select: { items: true } } },
            }),
            this.prisma.bom.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const bom = await this.prisma.bom.findFirst({
            where,
            include: Object.assign({ product: { select: { code: true, name: true } }, revision: { select: { revisionNumber: true } } }, this.itemIncludes()),
        });
        if (!bom)
            throw new common_1.NotFoundException('BOM not found');
        return bom;
    }
    async findByProduct(productId, user) {
        const where = { productId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.bom.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { product: { select: { code: true, name: true } }, _count: { select: { items: true } } },
        });
    }
    async update(id, dto, user) {
        const bom = await this.findOne(id, user);
        if (bom.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT BOMs can be edited');
        const updated = await this.prisma.bom.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
            include: Object.assign({ product: { select: { code: true, name: true } } }, this.itemIncludes()),
        });
        await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const bom = await this.findOne(id, user);
        if (bom.status === 'APPROVED')
            throw new common_1.BadRequestException('Cannot deactivate an approved BOM');
        const updated = await this.prisma.bom.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'boms', recordId: id, action: 'DELETE', oldValues: bom, newValues: updated, changedBy: user.id });
        return { message: 'BOM deactivated' };
    }
    async approve(id, user) {
        const bom = await this.findOne(id, user);
        if (bom.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT BOMs can be approved');
        if (!bom.items || bom.items.length === 0)
            throw new common_1.BadRequestException('Cannot approve BOM with no items');
        const updated = await this.prisma.bom.update({
            where: { id },
            data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), updatedBy: user.id },
            include: Object.assign({ product: { select: { code: true, name: true } } }, this.itemIncludes()),
        });
        await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });
        return updated;
    }
    async obsolete(id, user) {
        const bom = await this.findOne(id, user);
        if (bom.status === 'OBSOLETE')
            throw new common_1.BadRequestException('Already obsolete');
        const updated = await this.prisma.bom.update({ where: { id }, data: { status: 'OBSOLETE', updatedBy: user.id } });
        await this.audit.log({ tableName: 'boms', recordId: id, action: 'UPDATE', oldValues: bom, newValues: updated, changedBy: user.id });
        return updated;
    }
    async clone(id, user) {
        const bom = await this.findOne(id, user);
        const bomNumber = await this.generateBomNumber(user.companyId);
        const versionNum = parseInt((bom.version || 'v1').replace(/[^0-9]/g, '') || '1') + 1;
        const cloned = await this.prisma.bom.create({
            data: {
                companyId: user.companyId, productId: bom.productId,
                bomNumber, version: `v${versionNum}`,
                description: `Cloned from ${bom.bomNumber}`,
                effectiveFrom: new Date(), status: 'DRAFT',
                createdBy: user.id, updatedBy: user.id,
            },
        });
        if (bom.items && bom.items.length > 0) {
            await this.prisma.bomItem.createMany({
                data: bom.items.map(item => ({
                    bomId: cloned.id, companyId: user.companyId,
                    sequence: item.sequence, itemType: item.itemType,
                    rawMaterialId: item.rawMaterialId,
                    itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                    quantity: item.quantity, wastagePercent: item.wastagePercent,
                    effectiveQty: item.effectiveQty, unitCost: item.unitCost,
                    totalCost: item.totalCost, isCritical: item.isCritical,
                    notes: item.notes, createdBy: user.id, updatedBy: user.id,
                })),
            });
        }
        await this.audit.log({ tableName: 'boms', recordId: cloned.id, action: 'CREATE', newValues: cloned, changedBy: user.id });
        return this.findOne(cloned.id, user);
    }
    async addItem(bomId, dto, user) {
        const bom = await this.findOne(bomId, user);
        if (bom.status !== 'DRAFT')
            throw new common_1.BadRequestException('Can only add items to DRAFT BOMs');
        const wastage = dto.wastagePercent || 0;
        const effectiveQty = dto.quantity * (1 + wastage / 100);
        const totalCost = dto.unitCost ? effectiveQty * dto.unitCost : null;
        const item = await this.prisma.bomItem.create({
            data: Object.assign(Object.assign({}, dto), { bomId, companyId: user.companyId, effectiveQty, totalCost, createdBy: user.id, updatedBy: user.id }),
        });
        await this.recalculateBomCost(bomId);
        await this.audit.log({ tableName: 'bom_items', recordId: item.id, action: 'CREATE', newValues: item, changedBy: user.id });
        return item;
    }
    async updateItem(bomId, itemId, dto, user) {
        var _a, _b, _c, _d;
        const bom = await this.findOne(bomId, user);
        if (bom.status !== 'DRAFT')
            throw new common_1.BadRequestException('Can only edit items in DRAFT BOMs');
        const item = await this.prisma.bomItem.findFirst({ where: { id: itemId, bomId } });
        if (!item)
            throw new common_1.NotFoundException('BOM item not found');
        const quantity = (_a = dto.quantity) !== null && _a !== void 0 ? _a : item.quantity;
        const wastage = (_c = (_b = dto.wastagePercent) !== null && _b !== void 0 ? _b : item.wastagePercent) !== null && _c !== void 0 ? _c : 0;
        const effectiveQty = quantity * (1 + wastage / 100);
        const unitCost = (_d = dto.unitCost) !== null && _d !== void 0 ? _d : item.unitCost;
        const totalCost = unitCost ? effectiveQty * unitCost : null;
        const updated = await this.prisma.bomItem.update({
            where: { id: itemId }, data: Object.assign(Object.assign({}, dto), { effectiveQty, totalCost, updatedBy: user.id }),
        });
        await this.recalculateBomCost(bomId);
        await this.audit.log({ tableName: 'bom_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
        return updated;
    }
    async removeItem(bomId, itemId, user) {
        const bom = await this.findOne(bomId, user);
        if (bom.status !== 'DRAFT')
            throw new common_1.BadRequestException('Can only remove items from DRAFT BOMs');
        const item = await this.prisma.bomItem.findFirst({ where: { id: itemId, bomId } });
        if (!item)
            throw new common_1.NotFoundException('BOM item not found');
        const updated = await this.prisma.bomItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
        await this.recalculateBomCost(bomId);
        await this.audit.log({ tableName: 'bom_items', recordId: itemId, action: 'DELETE', oldValues: item, newValues: updated, changedBy: user.id });
        return { message: 'BOM item removed' };
    }
    async recalculateBomCost(bomId) {
        const items = await this.prisma.bomItem.findMany({ where: { bomId, isActive: true } });
        const totalCost = items.reduce((sum, i) => sum + (i.totalCost || 0), 0);
        await this.prisma.bom.update({ where: { id: bomId }, data: { totalCost } });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, approved, obsolete] = await Promise.all([
            this.prisma.bom.count({ where }),
            this.prisma.bom.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.bom.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.bom.count({ where: Object.assign(Object.assign({}, where), { status: 'OBSOLETE' }) }),
        ]);
        const totalItems = await this.prisma.bomItem.count({ where: { companyId: user.companyId, isActive: true } });
        return { total, draft, approved, obsolete, totalItems };
    }
};
exports.BomService = BomService;
exports.BomService = BomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], BomService);
//# sourceMappingURL=bom.service.js.map