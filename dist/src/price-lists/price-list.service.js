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
exports.PriceListService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let PriceListService = class PriceListService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, user) {
        const exists = await this.prisma.priceList.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: dto.code.toUpperCase() } },
        });
        if (exists)
            throw new common_1.ConflictException(`Price list code ${dto.code} already exists`);
        const pl = await this.prisma.priceList.create({
            data: Object.assign(Object.assign({}, dto), { code: dto.code.toUpperCase(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'price_lists', recordId: pl.id, action: 'CREATE', newValues: pl, changedBy: user.id });
        return pl;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, listType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        if (listType)
            where.listType = listType;
        const [data, total] = await Promise.all([
            this.prisma.priceList.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { _count: { select: { items: true } } } }),
            this.prisma.priceList.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const pl = await this.prisma.priceList.findFirst({ where, include: { items: { where: { isActive: true }, orderBy: { itemCode: 'asc' } } } });
        if (!pl)
            throw new common_1.NotFoundException('Price list not found');
        return pl;
    }
    async update(id, dto, user) {
        const pl = await this.findOne(id, user);
        const updated = await this.prisma.priceList.update({ where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'price_lists', recordId: id, action: 'UPDATE', oldValues: pl, newValues: updated, changedBy: user.id });
        return updated;
    }
    async remove(id, user) {
        const pl = await this.findOne(id, user);
        const updated = await this.prisma.priceList.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'price_lists', recordId: id, action: 'DELETE', oldValues: pl, newValues: updated, changedBy: user.id });
        return { message: 'Price list deactivated' };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, sales, purchase] = await Promise.all([
            this.prisma.priceList.count({ where }),
            this.prisma.priceList.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
            this.prisma.priceList.count({ where: Object.assign(Object.assign({}, where), { listType: 'SALES', isActive: true }) }),
            this.prisma.priceList.count({ where: Object.assign(Object.assign({}, where), { listType: 'PURCHASE', isActive: true }) }),
        ]);
        const totalItems = await this.prisma.priceListItem.count({ where: { companyId: user.companyId } });
        return { total, active, inactive: total - active, sales, purchase, totalItems };
    }
    async addItem(priceListId, dto, user) {
        await this.findOne(priceListId, user);
        const item = await this.prisma.priceListItem.create({
            data: Object.assign(Object.assign({}, dto), { priceListId, companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
        });
        await this.audit.log({ tableName: 'price_list_items', recordId: item.id, action: 'CREATE', newValues: item, changedBy: user.id });
        return item;
    }
    async updateItem(priceListId, itemId, dto, user) {
        const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
        if (!item)
            throw new common_1.NotFoundException('Price list item not found');
        if (item.isApproved)
            throw new common_1.BadRequestException('Cannot modify an approved price. Create a new price entry instead.');
        const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }) });
        await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
        return updated;
    }
    async approveItem(priceListId, itemId, user) {
        const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
        if (!item)
            throw new common_1.NotFoundException('Price list item not found');
        if (item.isApproved)
            throw new common_1.BadRequestException('Price already approved');
        const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: { isApproved: true, updatedBy: user.id } });
        await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'UPDATE', oldValues: item, newValues: updated, changedBy: user.id });
        return updated;
    }
    async removeItem(priceListId, itemId, user) {
        const item = await this.prisma.priceListItem.findFirst({ where: { id: itemId, priceListId } });
        if (!item)
            throw new common_1.NotFoundException('Price list item not found');
        if (item.isApproved)
            throw new common_1.BadRequestException('Cannot delete an approved price');
        const updated = await this.prisma.priceListItem.update({ where: { id: itemId }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'price_list_items', recordId: itemId, action: 'DELETE', oldValues: item, newValues: updated, changedBy: user.id });
        return { message: 'Price item removed' };
    }
};
exports.PriceListService = PriceListService;
exports.PriceListService = PriceListService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PriceListService);
//# sourceMappingURL=price-list.service.js.map