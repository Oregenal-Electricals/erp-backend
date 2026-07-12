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
exports.StockLedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const customer_po_service_1 = require("../customer-po/customer-po.service");
let StockLedgerService = class StockLedgerService {
    constructor(prisma, audit, customerPoService) {
        this.prisma = prisma;
        this.audit = audit;
        this.customerPoService = customerPoService;
    }
    async postTransaction(data) {
        const { companyId, itemCode, itemName, warehouseId, transactionType, referenceType, referenceId, referenceNumber, inQty = 0, outQty = 0, unitCost = 0, remarks, userId } = data;
        let balance = await this.prisma.stockBalance.findFirst({
            where: { companyId, itemCode, warehouseId },
        });
        if (!balance) {
            balance = await this.prisma.stockBalance.create({
                data: {
                    companyId, itemCode, itemName, warehouseId,
                    availableQty: 0, unitCost: 0, totalValue: 0,
                    createdBy: userId, updatedBy: userId,
                },
            });
        }
        if (outQty > 0 && balance.availableQty < outQty) {
            throw new common_1.BadRequestException(`Insufficient stock for ${itemCode}. Available: ${balance.availableQty}, Required: ${outQty}`);
        }
        const newBalance = balance.availableQty + inQty - outQty;
        const totalCost = inQty * unitCost || outQty * balance.unitCost;
        let newUnitCost = balance.unitCost;
        if (inQty > 0 && unitCost > 0) {
            const existingValue = balance.availableQty * balance.unitCost;
            const newValue = inQty * unitCost;
            newUnitCost = (existingValue + newValue) / (balance.availableQty + inQty);
        }
        const ledgerEntry = await this.prisma.stockLedger.create({
            data: {
                companyId, itemCode, itemName, warehouseId,
                transactionType, referenceType, referenceId, referenceNumber,
                inQty, outQty, balanceQty: newBalance,
                unitCost: inQty > 0 ? unitCost : balance.unitCost,
                totalCost, remarks,
                createdBy: userId, updatedBy: userId,
            },
        });
        await this.prisma.stockBalance.update({
            where: { id: balance.id },
            data: {
                availableQty: newBalance,
                unitCost: newUnitCost,
                totalValue: newBalance * newUnitCost,
                lastUpdated: new Date(),
                updatedBy: userId,
            },
        });
        if (inQty > 0) {
            try {
                await this.customerPoService.recheckAllOpenPos(companyId, userId);
            }
            catch (e) {
            }
        }
        return ledgerEntry;
    }
    async receiveFromIqc(iqcId, user) {
        const iqc = await this.prisma.iqcInspection.findFirst({
            where: { id: iqcId, companyId: user.companyId },
            include: {
                items: { where: { isActive: true } },
                grn: { include: { ipo: true, po: true } },
            },
        });
        if (!iqc)
            throw new common_1.NotFoundException('IQC not found');
        if (iqc.status !== 'APPROVED')
            throw new common_1.BadRequestException('IQC must be APPROVED');
        const grn = iqc.grn;
        const entries = [];
        for (const item of iqc.items) {
            if (item.acceptedQty > 0) {
                const grnItem = await this.prisma.grnItem.findFirst({ where: { id: item.grnItemId } });
                const unitCost = (grnItem === null || grnItem === void 0 ? void 0 : grnItem.landedCostPerUnit) || (grnItem === null || grnItem === void 0 ? void 0 : grnItem.unitPrice) || 0;
                const entry = await this.postTransaction({
                    companyId: user.companyId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    warehouseId: grn.warehouseId,
                    transactionType: 'IQC_ACCEPT',
                    referenceType: 'IQC',
                    referenceId: iqcId,
                    referenceNumber: iqc.iqcNumber,
                    inQty: item.acceptedQty,
                    unitCost,
                    remarks: `Stock received from IQC ${iqc.iqcNumber}`,
                    userId: user.id,
                });
                entries.push(entry);
            }
        }
        await this.audit.log({ tableName: 'stock_ledger', recordId: iqcId, action: 'CREATE', newValues: { entries: entries.length }, changedBy: user.id });
        return { message: `${entries.length} stock entries created`, entries };
    }
    async findLedger(user, query) {
        const { page = 1, limit = 20, itemCode, warehouseId, transactionType } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (itemCode)
            where.itemCode = { contains: itemCode, mode: 'insensitive' };
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (transactionType)
            where.transactionType = transactionType;
        const [data, total] = await Promise.all([
            this.prisma.stockLedger.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { warehouse: { select: { name: true, code: true } } },
            }),
            this.prisma.stockLedger.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findBalance(user, query) {
        const { page = 1, limit = 50, search, warehouseId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { itemCode: { contains: search, mode: 'insensitive' } },
                { itemName: { contains: search, mode: 'insensitive' } },
            ];
        if (warehouseId)
            where.warehouseId = warehouseId;
        const [data, total] = await Promise.all([
            this.prisma.stockBalance.findMany({
                where, skip, take: Number(limit), orderBy: { itemCode: 'asc' },
                include: { warehouse: { select: { name: true, code: true } } },
            }),
            this.prisma.stockBalance.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async getItemLedger(itemCode, user) {
        const where = { itemCode };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.stockLedger.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 50,
            include: { warehouse: { select: { name: true } } },
        });
    }
    async adjust(dto, user) {
        const inQty = dto.adjustmentType === 'ADD' ? dto.qty : 0;
        const outQty = dto.adjustmentType === 'REMOVE' ? dto.qty : 0;
        return this.postTransaction({
            companyId: user.companyId,
            itemCode: dto.itemCode,
            itemName: dto.itemCode,
            warehouseId: dto.warehouseId,
            transactionType: 'ADJUSTMENT',
            inQty, outQty,
            unitCost: dto.unitCost,
            remarks: dto.remarks,
            userId: user.id,
        });
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [totalItems, totalMovements, totalValue] = await Promise.all([
            this.prisma.stockBalance.count({ where: Object.assign(Object.assign({}, where), { availableQty: { gt: 0 } }) }),
            this.prisma.stockLedger.count({ where }),
            this.prisma.stockBalance.aggregate({ where, _sum: { totalValue: true } }),
        ]);
        const byType = await this.prisma.stockLedger.groupBy({ by: ['transactionType'], where, _count: true, _sum: { inQty: true, outQty: true } });
        return { totalItems, totalMovements, totalValue: totalValue._sum.totalValue || 0, byType };
    }
};
exports.StockLedgerService = StockLedgerService;
exports.StockLedgerService = StockLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, customer_po_service_1.CustomerPoService])
], StockLedgerService);
//# sourceMappingURL=stock-ledger.service.js.map