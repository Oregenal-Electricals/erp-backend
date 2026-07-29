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
exports.StockBatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let StockBatchService = class StockBatchService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateBatchNumber(companyId) {
        const count = await this.prisma.stockBatch.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `BAT-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto, user) {
        const batchNumber = await this.generateBatchNumber(user.companyId);
        const batch = await this.prisma.stockBatch.create({
            data: Object.assign(Object.assign({}, dto), { batchNumber, availableQty: dto.originalQty, mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined, expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(), companyId: user.companyId, createdBy: user.id, updatedBy: user.id }),
            include: { warehouse: { select: { name: true, code: true } } },
        });
        await this.audit.log({ tableName: 'stock_batches', recordId: batch.id, action: 'CREATE', newValues: batch, changedBy: user.id });
        return batch;
    }
    async createFromGrn(grnId, user) {
        const grn = await this.prisma.grnHeader.findFirst({
            where: { id: grnId, companyId: user.companyId },
            include: { items: { where: { isActive: true, acceptedQty: { gt: 0 } } } },
        });
        if (!grn)
            throw new common_1.NotFoundException('GRN not found');
        if (!['ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(grn.status)) {
            throw new common_1.BadRequestException('GRN must be accepted before creating batches');
        }
        const batches = [];
        for (const item of grn.items) {
            if (item.acceptedQty <= 0)
                continue;
            const existing = await this.prisma.stockBatch.findFirst({
                where: { grnItemId: item.id, companyId: user.companyId },
            });
            if (existing)
                continue;
            const batchNumber = await this.generateBatchNumber(user.companyId);
            const batch = await this.prisma.stockBatch.create({
                data: {
                    batchNumber,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    uom: item.uom,
                    warehouseId: grn.warehouseId,
                    grnId: grn.id,
                    grnItemId: item.id,
                    originalQty: item.acceptedQty,
                    availableQty: item.acceptedQty,
                    unitCost: item.landedCostPerUnit || item.unitPrice,
                    companyId: user.companyId,
                    createdBy: user.id, updatedBy: user.id,
                },
            });
            batches.push(batch);
        }
        await this.audit.log({ tableName: 'stock_batches', recordId: grnId, action: 'CREATE', newValues: { batches: batches.length }, changedBy: user.id });
        return { created: batches.length, batches };
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, itemCode } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { batchNumber: { contains: search, mode: 'insensitive' } },
                { lotNumber: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (itemCode)
            where.itemCode = { contains: itemCode, mode: 'insensitive' };
        await this.prisma.stockBatch.updateMany({
            where: { companyId: user.companyId, status: 'ACTIVE', expiryDate: { lt: new Date() } },
            data: { status: 'EXPIRED' },
        });
        const [data, total] = await Promise.all([
            this.prisma.stockBatch.findMany({
                where, skip, take: Number(limit), orderBy: [{ receivedDate: 'asc' }, { createdAt: 'asc' }],
                include: { warehouse: { select: { name: true, code: true } } },
            }),
            this.prisma.stockBatch.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const batch = await this.prisma.stockBatch.findFirst({ where, include: { warehouse: { select: { name: true } } } });
        if (!batch)
            throw new common_1.NotFoundException('Batch not found');
        return batch;
    }
    async findByItem(itemCode, user) {
        const where = { itemCode, status: 'ACTIVE' };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.stockBatch.findMany({
            where, orderBy: [{ receivedDate: 'asc' }],
            include: { warehouse: { select: { name: true } } },
        });
    }
    async update(id, dto, user) {
        const batch = await this.findOne(id, user);
        if (['EXHAUSTED', 'EXPIRED'].includes(batch.status))
            throw new common_1.BadRequestException('Cannot edit exhausted or expired batch');
        return this.prisma.stockBatch.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined, expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, updatedBy: user.id }),
            include: { warehouse: { select: { name: true } } },
        });
    }
    async quarantine(id, user) {
        const batch = await this.findOne(id, user);
        if (batch.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Only ACTIVE batches can be quarantined');
        return this.prisma.stockBatch.update({
            where: { id }, data: { status: 'QUARANTINED', updatedBy: user.id },
        });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, active, expired, exhausted, quarantined] = await Promise.all([
            this.prisma.stockBatch.count({ where }),
            this.prisma.stockBatch.count({ where: Object.assign(Object.assign({}, where), { status: 'ACTIVE' }) }),
            this.prisma.stockBatch.count({ where: Object.assign(Object.assign({}, where), { status: 'EXPIRED' }) }),
            this.prisma.stockBatch.count({ where: Object.assign(Object.assign({}, where), { status: 'EXHAUSTED' }) }),
            this.prisma.stockBatch.count({ where: Object.assign(Object.assign({}, where), { status: 'QUARANTINED' }) }),
        ]);
        const expiringIn30 = await this.prisma.stockBatch.count({
            where: Object.assign(Object.assign({}, where), { status: 'ACTIVE', expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() } }),
        });
        const totalValue = await this.prisma.stockBatch.aggregate({ where: Object.assign(Object.assign({}, where), { status: 'ACTIVE' }), _sum: { availableQty: true } });
        return { total, active, expired, exhausted, quarantined, expiringIn30, totalActiveBatchQty: totalValue._sum.availableQty || 0 };
    }
};
exports.StockBatchService = StockBatchService;
exports.StockBatchService = StockBatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], StockBatchService);
//# sourceMappingURL=stock-batch.service.js.map