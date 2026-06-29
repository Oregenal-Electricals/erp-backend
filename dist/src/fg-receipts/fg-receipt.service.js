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
exports.FgReceiptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let FgReceiptService = class FgReceiptService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.fgReceipt.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `FGR-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true, completedQty: true } },
            warehouse: { select: { name: true, code: true } },
        };
    }
    async createFromWo(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (wo.status !== 'COMPLETED')
            throw new common_1.BadRequestException('Work order must be COMPLETED');
        const existing = await this.prisma.fgReceipt.findFirst({
            where: { workOrderId, companyId: user.companyId, status: 'RECEIVED' },
        });
        if (existing)
            throw new common_1.BadRequestException(`FG Receipt ${existing.receiptNumber} already exists for this WO`);
        return this.create({
            workOrderId, warehouseId: wo.warehouseId,
            receivedQty: wo.completedQty, rejectedQty: wo.rejectedQty || 0,
            batchNumber: `FG-${wo.woNumber}-${new Date().getFullYear()}`,
            unitCost: 0, remarks: `Auto-created from WO ${wo.woNumber}`,
        }, user);
    }
    async create(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: dto.workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!['COMPLETED', 'IN_PROGRESS'].includes(wo.status)) {
            throw new common_1.BadRequestException('Work order must be COMPLETED or IN_PROGRESS');
        }
        if (dto.receivedQty > wo.completedQty) {
            throw new common_1.BadRequestException(`Cannot receive more than completed qty (${wo.completedQty})`);
        }
        const receiptNumber = await this.generateNumber(user.companyId);
        const totalCost = dto.receivedQty * (dto.unitCost || 0);
        const receipt = await this.prisma.fgReceipt.create({
            data: {
                receiptNumber, workOrderId: dto.workOrderId,
                warehouseId: dto.warehouseId,
                itemCode: wo.productCode, itemName: wo.productName, uom: wo.uom,
                plannedQty: wo.plannedQty, receivedQty: dto.receivedQty,
                rejectedQty: dto.rejectedQty || 0,
                batchNumber: dto.batchNumber, unitCost: dto.unitCost || 0, totalCost,
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'fg_receipts', recordId: receipt.id, action: 'CREATE', newValues: receipt, changedBy: user.id });
        return receipt;
    }
    async confirm(id, user) {
        const receipt = await this.prisma.fgReceipt.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!receipt)
            throw new common_1.NotFoundException('FG Receipt not found');
        if (receipt.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT receipts can be confirmed');
        await this.stockLedger.postTransaction({
            companyId: user.companyId,
            itemCode: receipt.itemCode, itemName: receipt.itemName,
            warehouseId: receipt.warehouseId,
            transactionType: 'RECEIPT',
            referenceType: 'FG_RECEIPT',
            referenceId: receipt.id, referenceNumber: receipt.receiptNumber,
            inQty: receipt.receivedQty, unitCost: receipt.unitCost,
            remarks: `FG Receipt from WO`,
            userId: user.id,
        });
        if (receipt.batchNumber) {
            await this.prisma.stockBatch.create({
                data: {
                    batchNumber: receipt.batchNumber, itemCode: receipt.itemCode,
                    itemName: receipt.itemName, warehouseId: receipt.warehouseId,
                    originalQty: receipt.receivedQty, availableQty: receipt.receivedQty,
                    unitCost: receipt.unitCost, status: 'ACTIVE',
                    companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                },
            }).catch(() => { });
        }
        const updated = await this.prisma.fgReceipt.update({
            where: { id }, data: { status: 'RECEIVED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'fg_receipts', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [
                { receiptNumber: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.fgReceipt.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: this.includes(),
            }),
            this.prisma.fgReceipt.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const receipt = await this.prisma.fgReceipt.findFirst({
            where: { id, companyId: user.companyId }, include: this.includes(),
        });
        if (!receipt)
            throw new common_1.NotFoundException('FG Receipt not found');
        return receipt;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, received] = await Promise.all([
            this.prisma.fgReceipt.count({ where }),
            this.prisma.fgReceipt.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.fgReceipt.count({ where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }) }),
        ]);
        const totals = await this.prisma.fgReceipt.aggregate({
            where: Object.assign(Object.assign({}, where), { status: 'RECEIVED' }),
            _sum: { receivedQty: true, totalCost: true },
        });
        return {
            total, draft, received,
            totalReceivedQty: totals._sum.receivedQty || 0,
            totalValue: totals._sum.totalCost || 0,
        };
    }
    async getCompletedWosWithoutFgr(user) {
        const companyId = user.companyId;
        const completedWos = await this.prisma.workOrder.findMany({
            where: { companyId, status: 'COMPLETED' },
            select: { id: true, woNumber: true, productCode: true, productName: true, completedQty: true, uom: true },
        });
        const result = [];
        for (const wo of completedWos) {
            const fgr = await this.prisma.fgReceipt.findFirst({
                where: { workOrderId: wo.id, companyId, status: 'RECEIVED' },
            });
            if (!fgr)
                result.push(wo);
        }
        return { data: result, total: result.length };
    }
};
exports.FgReceiptService = FgReceiptService;
exports.FgReceiptService = FgReceiptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], FgReceiptService);
//# sourceMappingURL=fg-receipt.service.js.map