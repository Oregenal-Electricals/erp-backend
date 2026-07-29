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
exports.ItemMasterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let ItemMasterService = class ItemMasterService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createUom(dto, user) {
        const exists = await this.prisma.unitOfMeasure.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`UOM ${dto.code} already exists`);
        const uom = await this.prisma.unitOfMeasure.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'unit_of_measures', recordId: uom.id, action: 'CREATE', newValues: uom, changedBy: user.id });
        return uom;
    }
    async findAllUoms(user) {
        return this.prisma.unitOfMeasure.findMany({
            where: { companyId: user.companyId, isActive: true },
            include: { _count: { select: { items: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async updateUom(id, dto, user) {
        const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id } });
        if (!uom)
            throw new common_1.NotFoundException('UOM not found');
        const updated = await this.prisma.unitOfMeasure.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'unit_of_measures', recordId: id, action: 'UPDATE', oldValues: uom, newValues: dto, changedBy: user.id });
        return updated;
    }
    async toggleUomStatus(id, user) {
        const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id } });
        if (!uom)
            throw new common_1.NotFoundException('UOM not found');
        return this.prisma.unitOfMeasure.update({ where: { id }, data: { isActive: !uom.isActive, updatedBy: user.id } });
    }
    async createCategory(dto, user) {
        const exists = await this.prisma.itemCategory.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Category ${dto.code} already exists`);
        const cat = await this.prisma.itemCategory.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: { parent: { select: { id: true, name: true, code: true } } },
        });
        await this.audit.log({ tableName: 'item_categories', recordId: cat.id, action: 'CREATE', newValues: cat, changedBy: user.id });
        return cat;
    }
    async findAllCategories(user) {
        return this.prisma.itemCategory.findMany({
            where: { companyId: user.companyId, isActive: true },
            include: {
                parent: { select: { id: true, name: true, code: true } },
                children: { select: { id: true, name: true, code: true } },
                _count: { select: { items: true } },
            },
            orderBy: { code: 'asc' },
        });
    }
    async updateCategory(id, dto, user) {
        const cat = await this.prisma.itemCategory.findUnique({ where: { id } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        const updated = await this.prisma.itemCategory.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }),
            include: { parent: { select: { id: true, name: true } } },
        });
        await this.audit.log({ tableName: 'item_categories', recordId: id, action: 'UPDATE', oldValues: cat, newValues: dto, changedBy: user.id });
        return updated;
    }
    async createItem(dto, user) {
        const exists = await this.prisma.item.findUnique({
            where: { companyId_itemCode: { companyId: user.companyId, itemCode: dto.itemCode.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Item ${dto.itemCode} already exists`);
        const uom = await this.prisma.unitOfMeasure.findUnique({ where: { id: dto.uomId } });
        if (!uom)
            throw new common_1.NotFoundException('UOM not found');
        const item = await this.prisma.item.create({
            data: Object.assign(Object.assign({}, dto), { itemCode: dto.itemCode.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: this.itemIncludes(),
        });
        await this.audit.log({ tableName: 'items', recordId: item.id, action: 'CREATE', newValues: { itemCode: item.itemCode, itemName: item.itemName }, changedBy: user.id });
        return item;
    }
    async findAllItems(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.itemType)
            where.itemType = filters.itemType;
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        if (filters.status)
            where.status = filters.status;
        if (filters.search) {
            where.OR = [
                { itemCode: { contains: filters.search.toUpperCase(), mode: 'insensitive' } },
                { itemName: { contains: filters.search, mode: 'insensitive' } },
                { shortName: { contains: filters.search, mode: 'insensitive' } },
                { hsnCode: { contains: filters.search, mode: 'insensitive' } },
                { barcode: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.item.findMany({ where, include: this.itemIncludes(), orderBy: { itemCode: 'asc' } });
    }
    async findOneItem(id) {
        const item = await this.prisma.item.findUnique({ where: { id }, include: this.itemIncludes() });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async updateItem(id, dto, user) {
        const item = await this.prisma.item.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        const updated = await this.prisma.item.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.itemIncludes() });
        await this.audit.log({ tableName: 'items', recordId: id, action: 'UPDATE', oldValues: item, newValues: dto, changedBy: user.id });
        return updated;
    }
    async toggleItemStatus(id, user) {
        const item = await this.prisma.item.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return this.prisma.item.update({ where: { id }, data: { status: newStatus, updatedBy: user.id } });
    }
    async getStats(user) {
        const base = { companyId: user.companyId };
        const [total, active, byType] = await Promise.all([
            this.prisma.item.count({ where: base }),
            this.prisma.item.count({ where: Object.assign(Object.assign({}, base), { status: 'ACTIVE' }) }),
            this.prisma.item.groupBy({ by: ['itemType'], where: base, _count: { id: true } }),
        ]);
        return { total, active, byType };
    }
    itemIncludes() {
        return {
            uom: { select: { id: true, code: true, name: true } },
            purchaseUom: { select: { id: true, code: true, name: true } },
            salesUom: { select: { id: true, code: true, name: true } },
            category: { select: { id: true, code: true, name: true } },
        };
    }
};
exports.ItemMasterService = ItemMasterService;
exports.ItemMasterService = ItemMasterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ItemMasterService);
//# sourceMappingURL=item-master.service.js.map