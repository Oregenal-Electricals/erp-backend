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
exports.PriceHistoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PriceHistoryService = class PriceHistoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getItemHistory(itemCode, user) {
        const where = { itemCode: { contains: itemCode, mode: 'insensitive' } };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const items = await this.prisma.priceListItem.findMany({
            where,
            include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
            orderBy: { validFrom: 'desc' },
        });
        return items;
    }
    async getEffectivePrice(itemCode, user) {
        const now = new Date();
        const where = {
            itemCode: { contains: itemCode, mode: 'insensitive' },
            isApproved: true,
            isActive: true,
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gte: now } }],
        };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const items = await this.prisma.priceListItem.findMany({
            where,
            include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
            orderBy: { validFrom: 'desc' },
        });
        return items;
    }
    async getListHistory(priceListId, user) {
        const where = { priceListId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const items = await this.prisma.priceListItem.findMany({
            where,
            orderBy: [{ itemCode: 'asc' }, { validFrom: 'desc' }],
        });
        return items;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const now = new Date();
        const [total, approved, active, expired] = await Promise.all([
            this.prisma.priceListItem.count({ where }),
            this.prisma.priceListItem.count({ where: Object.assign(Object.assign({}, where), { isApproved: true }) }),
            this.prisma.priceListItem.count({ where: Object.assign(Object.assign({}, where), { isApproved: true, isActive: true, validFrom: { lte: now }, OR: [{ validTo: null }, { validTo: { gte: now } }] }) }),
            this.prisma.priceListItem.count({ where: Object.assign(Object.assign({}, where), { validTo: { lt: now } }) }),
        ]);
        return { total, approved, active, expired, pending: total - approved };
    }
    async search(user, query) {
        const { search, listType, isApproved, page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { itemCode: { contains: search, mode: 'insensitive' } },
                { itemName: { contains: search, mode: 'insensitive' } },
            ];
        if (isApproved !== undefined)
            where.isApproved = isApproved === 'true';
        if (listType)
            where.priceList = { listType };
        const [data, total] = await Promise.all([
            this.prisma.priceListItem.findMany({
                where, skip, take: Number(limit),
                include: { priceList: { select: { code: true, name: true, listType: true, currency: true } } },
                orderBy: { validFrom: 'desc' },
            }),
            this.prisma.priceListItem.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
};
exports.PriceHistoryService = PriceHistoryService;
exports.PriceHistoryService = PriceHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PriceHistoryService);
//# sourceMappingURL=price-history.service.js.map