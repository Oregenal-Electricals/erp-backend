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
exports.StockTransferService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let StockTransferService = class StockTransferService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.stockTransfer.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `TRF-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            fromWarehouse: { select: { name: true, code: true } },
            toWarehouse: { select: { name: true, code: true } },
            items: { where: { isActive: true }, include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
        };
    }
    async create(dto, user) {
        if (!dto.items || dto.items.length === 0)
            throw new common_1.BadRequestException('Transfer must have at least one item');
        if (dto.fromWarehouseId === dto.toWarehouseId && dto.transferType === 'INTER_WAREHOUSE') {
            throw new common_1.BadRequestException('Source and destination warehouses must be different for inter-warehouse transfer');
        }
        for (const item of dto.items) {
            const balance = await this.prisma.stockBalance.findFirst({
                where: { companyId: user.companyId, warehouseId: dto.fromWarehouseId, itemCode: item.itemCode },
            });
            if (!balance || balance.availableQty < item.qty) {
                throw new common_1.BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${(balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0}, Required: ${item.qty}`);
            }
        }
        const transferNumber = await this.generateNumber(user.companyId);
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                transferNumber, transferType: dto.transferType,
                fromWarehouseId: dto.fromWarehouseId, toWarehouseId: dto.toWarehouseId,
                fromBinId: dto.fromBinId, toBinId: dto.toBinId,
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: {
                    create: dto.items.map(item => (Object.assign(Object.assign({}, item), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))),
                },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_transfers', recordId: transfer.id, action: 'CREATE', newValues: transfer, changedBy: user.id });
        return transfer;
    }
    async confirm(id, user) {
        const transfer = await this.prisma.stockTransfer.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: { include: { batch: true } } },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT transfers can be confirmed');
        for (const item of transfer.items) {
            await this.stockLedger.postTransaction({
                companyId: user.companyId,
                itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: transfer.fromWarehouseId,
                transactionType: 'TRANSFER_OUT',
                referenceType: 'STOCK_TRANSFER',
                referenceId: transfer.id,
                referenceNumber: transfer.transferNumber,
                outQty: item.qty, unitCost: item.unitCost,
                remarks: `Transfer to ${transfer.toWarehouseId}`,
                userId: user.id,
            });
            await this.stockLedger.postTransaction({
                companyId: user.companyId,
                itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: transfer.toWarehouseId,
                transactionType: 'TRANSFER_IN',
                referenceType: 'STOCK_TRANSFER',
                referenceId: transfer.id,
                referenceNumber: transfer.transferNumber,
                inQty: item.qty, unitCost: item.unitCost,
                remarks: `Transfer from ${transfer.fromWarehouseId}`,
                userId: user.id,
            });
            if (item.batchId) {
                await this.prisma.stockBatch.update({
                    where: { id: item.batchId },
                    data: { warehouseId: transfer.toWarehouseId, updatedBy: user.id },
                });
            }
            if (transfer.fromBinId) {
                const fromBin = await this.prisma.warehouseBin.findUnique({ where: { id: transfer.fromBinId } });
                if (fromBin) {
                    const newQty = Math.max(0, fromBin.currentQty - item.qty);
                    await this.prisma.warehouseBin.update({
                        where: { id: transfer.fromBinId },
                        data: { currentQty: newQty, status: newQty === 0 ? 'EMPTY' : 'PARTIAL', updatedBy: user.id },
                    });
                }
            }
            if (transfer.toBinId) {
                const toBin = await this.prisma.warehouseBin.findUnique({ where: { id: transfer.toBinId } });
                if (toBin) {
                    const newQty = toBin.currentQty + item.qty;
                    const newStatus = toBin.maxQty && newQty >= toBin.maxQty ? 'FULL' : 'PARTIAL';
                    await this.prisma.warehouseBin.update({
                        where: { id: transfer.toBinId },
                        data: { currentQty: newQty, itemCode: item.itemCode, status: newStatus, updatedBy: user.id },
                    });
                }
            }
        }
        const updated = await this.prisma.stockTransfer.update({
            where: { id }, data: { status: 'CONFIRMED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'stock_transfers', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const transfer = await this.prisma.stockTransfer.findFirst({ where: { id, companyId: user.companyId } });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT transfers can be cancelled');
        return this.prisma.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: user.id }, include: this.includes() });
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, transferType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ transferNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        if (transferType)
            where.transferType = transferType;
        const [data, total] = await Promise.all([
            this.prisma.stockTransfer.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    fromWarehouse: { select: { name: true } },
                    toWarehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.stockTransfer.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const transfer = await this.prisma.stockTransfer.findFirst({ where, include: this.includes() });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        return transfer;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, confirmed, cancelled] = await Promise.all([
            this.prisma.stockTransfer.count({ where }),
            this.prisma.stockTransfer.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.stockTransfer.count({ where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }) }),
            this.prisma.stockTransfer.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
        ]);
        const byType = await this.prisma.stockTransfer.groupBy({ by: ['transferType'], where, _count: true });
        return { total, draft, confirmed, cancelled, byType };
    }
};
exports.StockTransferService = StockTransferService;
exports.StockTransferService = StockTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], StockTransferService);
//# sourceMappingURL=stock-transfer.service.js.map