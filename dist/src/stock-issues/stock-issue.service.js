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
exports.StockIssueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let StockIssueService = class StockIssueService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateIssueNumber(companyId) {
        const count = await this.prisma.stockIssue.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `ISS-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async allocateBatches(companyId, warehouseId, itemCode, requiredQty, method = 'FIFO') {
        const orderBy = method === 'FEFO'
            ? [{ expiryDate: 'asc' }, { receivedDate: 'asc' }]
            : [{ receivedDate: 'asc' }, { createdAt: 'asc' }];
        const batches = await this.prisma.stockBatch.findMany({
            where: { companyId, warehouseId, itemCode, status: 'ACTIVE', availableQty: { gt: 0 } },
            orderBy,
        });
        const allocation = [];
        let remaining = requiredQty;
        for (const batch of batches) {
            if (remaining <= 0)
                break;
            const toTake = Math.min(remaining, batch.availableQty);
            allocation.push({ batch, qty: toTake });
            remaining -= toTake;
        }
        if (remaining > 0) {
            throw new common_1.BadRequestException(`Insufficient stock for ${itemCode}. Available: ${requiredQty - remaining}, Required: ${requiredQty}`);
        }
        return allocation;
    }
    async getFifoPlan(warehouseId, itemCode, qty, method = 'FIFO', user) {
        const allocation = await this.allocateBatches(user.companyId, warehouseId, itemCode, qty, method);
        return {
            itemCode, warehouseId, requestedQty: qty, method,
            allocation: allocation.map(a => ({
                batchNumber: a.batch.batchNumber,
                lotNumber: a.batch.lotNumber,
                receivedDate: a.batch.receivedDate,
                expiryDate: a.batch.expiryDate,
                availableQty: a.batch.availableQty,
                toIssueQty: a.qty,
                unitCost: a.batch.unitCost,
            })),
        };
    }
    async create(dto, user) {
        if (!dto.items || dto.items.length === 0)
            throw new common_1.BadRequestException('Issue must have at least one item');
        const method = dto.issueMethod || 'FIFO';
        const issueNumber = await this.generateIssueNumber(user.companyId);
        const allocations = [];
        for (const item of dto.items) {
            const alloc = await this.allocateBatches(user.companyId, dto.warehouseId, item.itemCode, item.requestedQty, method);
            allocations.push({ item, alloc });
        }
        const issueItems = allocations.flatMap(({ item, alloc }) => alloc.map(a => ({
            itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
            requestedQty: item.requestedQty, issuedQty: a.qty,
            batchId: a.batch.id, unitCost: a.batch.unitCost,
            companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
        })));
        const issue = await this.prisma.stockIssue.create({
            data: {
                issueNumber, warehouseId: dto.warehouseId, issuedTo: dto.issuedTo,
                referenceType: dto.referenceType || 'INTERNAL',
                referenceId: dto.referenceId, issueMethod: method,
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: { create: issueItems },
            },
            include: {
                warehouse: { select: { name: true } },
                items: { include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
            },
        });
        await this.audit.log({ tableName: 'stock_issues', recordId: issue.id, action: 'CREATE', newValues: issue, changedBy: user.id });
        return issue;
    }
    async confirm(id, user) {
        const issue = await this.prisma.stockIssue.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: { include: { batch: true } } },
        });
        if (!issue)
            throw new common_1.NotFoundException('Stock issue not found');
        if (issue.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT issues can be confirmed');
        for (const item of issue.items) {
            if (!item.batchId || !item.batch)
                continue;
            const newQty = item.batch.availableQty - item.issuedQty;
            const newStatus = newQty <= 0 ? 'EXHAUSTED' : 'ACTIVE';
            await this.prisma.stockBatch.update({
                where: { id: item.batchId },
                data: { availableQty: Math.max(0, newQty), status: newStatus, updatedBy: user.id },
            });
            await this.stockLedger.postTransaction({
                companyId: user.companyId,
                itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: issue.warehouseId,
                transactionType: 'ISSUE',
                referenceType: 'STOCK_ISSUE',
                referenceId: issue.id,
                referenceNumber: issue.issueNumber,
                outQty: item.issuedQty,
                unitCost: item.unitCost,
                remarks: `Issued to ${issue.issuedTo}`,
                userId: user.id,
            });
        }
        const updated = await this.prisma.stockIssue.update({
            where: { id }, data: { status: 'ISSUED', updatedBy: user.id },
            include: { warehouse: { select: { name: true } }, items: { include: { batch: { select: { batchNumber: true, lotNumber: true } } } } },
        });
        await this.audit.log({ tableName: 'stock_issues', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ issueNumber: { contains: search, mode: 'insensitive' } }, { issuedTo: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.stockIssue.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
            }),
            this.prisma.stockIssue.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const issue = await this.prisma.stockIssue.findFirst({
            where,
            include: { warehouse: { select: { name: true } }, items: { include: { batch: { select: { batchNumber: true, lotNumber: true, receivedDate: true } } } } },
        });
        if (!issue)
            throw new common_1.NotFoundException('Stock issue not found');
        return issue;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, issued] = await Promise.all([
            this.prisma.stockIssue.count({ where }),
            this.prisma.stockIssue.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.stockIssue.count({ where: Object.assign(Object.assign({}, where), { status: 'ISSUED' }) }),
        ]);
        const totalIssued = await this.prisma.stockIssueItem.aggregate({
            where: { companyId: where.companyId }, _sum: { issuedQty: true },
        });
        return { total, draft, issued, totalQtyIssued: totalIssued._sum.issuedQty || 0 };
    }
};
exports.StockIssueService = StockIssueService;
exports.StockIssueService = StockIssueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], StockIssueService);
//# sourceMappingURL=stock-issue.service.js.map