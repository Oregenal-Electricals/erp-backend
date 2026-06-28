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
exports.StockAdjustmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let StockAdjustmentService = class StockAdjustmentService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.stockAdjustment.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `ADJ-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            warehouse: { select: { name: true, code: true } },
            items: { where: { isActive: true } },
        };
    }
    async create(dto, user) {
        if (!dto.items || dto.items.length === 0)
            throw new common_1.BadRequestException('Adjustment must have at least one item');
        const adjustmentNumber = await this.generateNumber(user.companyId);
        const items = dto.items.map(item => {
            let adjustmentQty = 0;
            if (dto.adjustmentType === 'INCREASE')
                adjustmentQty = item.physicalQty - item.systemQty;
            else if (dto.adjustmentType === 'DECREASE')
                adjustmentQty = item.systemQty - item.physicalQty;
            else
                adjustmentQty = item.physicalQty - item.systemQty;
            return Object.assign(Object.assign({}, item), { adjustmentQty });
        });
        const adjustment = await this.prisma.stockAdjustment.create({
            data: {
                adjustmentNumber, warehouseId: dto.warehouseId,
                adjustmentType: dto.adjustmentType, reason: dto.reason,
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: { create: items.map(item => (Object.assign(Object.assign({}, item), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))) },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_adjustments', recordId: adjustment.id, action: 'CREATE', newValues: adjustment, changedBy: user.id });
        return adjustment;
    }
    async approve(id, user) {
        const adj = await this.prisma.stockAdjustment.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: true },
        });
        if (!adj)
            throw new common_1.NotFoundException('Adjustment not found');
        if (adj.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT adjustments can be approved');
        for (const item of adj.items) {
            const diff = item.adjustmentQty;
            if (diff === 0)
                continue;
            if (diff < 0) {
                const balance = await this.prisma.stockBalance.findFirst({
                    where: { companyId: user.companyId, warehouseId: adj.warehouseId, itemCode: item.itemCode },
                });
                if (!balance || balance.availableQty < Math.abs(diff)) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${(balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0}`);
                }
            }
            await this.stockLedger.postTransaction({
                companyId: user.companyId,
                itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: adj.warehouseId,
                transactionType: 'ADJUSTMENT',
                referenceType: 'STOCK_ADJUSTMENT',
                referenceId: adj.id, referenceNumber: adj.adjustmentNumber,
                inQty: diff > 0 ? diff : 0,
                outQty: diff < 0 ? Math.abs(diff) : 0,
                unitCost: item.unitCost,
                remarks: `${adj.adjustmentType} - ${adj.reason}`,
                userId: user.id,
            });
        }
        const updated = await this.prisma.stockAdjustment.update({
            where: { id }, data: { status: 'APPROVED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_adjustments', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const adj = await this.prisma.stockAdjustment.findFirst({ where: { id, companyId: user.companyId } });
        if (!adj)
            throw new common_1.NotFoundException('Adjustment not found');
        if (adj.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT adjustments can be cancelled');
        return this.prisma.stockAdjustment.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ adjustmentNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.stockAdjustment.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
            }),
            this.prisma.stockAdjustment.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const adj = await this.prisma.stockAdjustment.findFirst({ where, include: this.includes() });
        if (!adj)
            throw new common_1.NotFoundException('Adjustment not found');
        return adj;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, approved, cancelled] = await Promise.all([
            this.prisma.stockAdjustment.count({ where }),
            this.prisma.stockAdjustment.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.stockAdjustment.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
            this.prisma.stockAdjustment.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const byType = await this.prisma.stockAdjustment.groupBy({ by: ['adjustmentType'], where, _count: true });
        const byReason = await this.prisma.stockAdjustment.groupBy({ by: ['reason'], where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }), _count: true });
        return { total, draft, approved, cancelled, byType, byReason };
    }
};
exports.StockAdjustmentService = StockAdjustmentService;
exports.StockAdjustmentService = StockAdjustmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], StockAdjustmentService);
//# sourceMappingURL=stock-adjustment.service.js.map