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
exports.ProductionIssueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
const mrp_service_1 = require("../mrp/mrp.service");
let ProductionIssueService = class ProductionIssueService {
    constructor(prisma, audit, stockLedger, mrpService) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
        this.mrpService = mrpService;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.productionIssue.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `PI-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            workOrder: { select: { woNumber: true, productCode: true, productName: true, plannedQty: true } },
            warehouse: { select: { name: true, code: true } },
            items: { where: { isActive: true }, include: { batch: { select: { batchNumber: true, lotNumber: true } } } },
        };
    }
    async createFromMrp(workOrderId, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!['RELEASED', 'IN_PROGRESS'].includes(wo.status)) {
            throw new common_1.BadRequestException('Work order must be RELEASED or IN_PROGRESS');
        }
        const mrp = await this.mrpService.calculateMrp(workOrderId, user);
        const items = mrp.requirements.map(r => {
            var _a;
            return ({
                itemCode: r.itemCode, itemName: r.itemName, uom: r.uom,
                requiredQty: r.netRequired, issuedQty: Math.min(r.netRequired, r.availableQty),
                batchId: ((_a = r.batches) === null || _a === void 0 ? void 0 : _a[0]) ? undefined : undefined,
                unitCost: 0,
            });
        });
        return this.create({ workOrderId, warehouseId: wo.warehouseId, items, issueMethod: 'FIFO' }, user);
    }
    async create(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: dto.workOrderId, companyId: user.companyId },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        if (!['RELEASED', 'IN_PROGRESS'].includes(wo.status)) {
            throw new common_1.BadRequestException('Work order must be RELEASED or IN_PROGRESS');
        }
        const issueNumber = await this.generateNumber(user.companyId);
        const issue = await this.prisma.productionIssue.create({
            data: {
                issueNumber, workOrderId: dto.workOrderId,
                warehouseId: dto.warehouseId, issueMethod: dto.issueMethod || 'FIFO',
                remarks: dto.remarks, status: 'DRAFT',
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: {
                    create: dto.items.map(item => (Object.assign(Object.assign({}, item), { companyId: user.companyId, createdBy: user.id, updatedBy: user.id }))),
                },
            },
            include: this.includes(),
        });
        if (wo.status === 'RELEASED') {
            await this.prisma.workOrder.update({
                where: { id: dto.workOrderId },
                data: { status: 'IN_PROGRESS', actualStartDate: new Date(), updatedBy: user.id },
            });
        }
        await this.audit.log({ tableName: 'production_issues', recordId: issue.id, action: 'CREATE', newValues: issue, changedBy: user.id });
        return issue;
    }
    async confirm(id, user) {
        const issue = await this.prisma.productionIssue.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: true },
        });
        if (!issue)
            throw new common_1.NotFoundException('Production issue not found');
        if (issue.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT issues can be confirmed');
        for (const item of issue.items) {
            const balance = await this.prisma.stockBalance.findFirst({
                where: { companyId: user.companyId, warehouseId: issue.warehouseId, itemCode: item.itemCode },
            });
            if (!balance || balance.availableQty < item.issuedQty) {
                throw new common_1.BadRequestException(`Insufficient stock for ${item.itemCode}. Available: ${(balance === null || balance === void 0 ? void 0 : balance.availableQty) || 0}`);
            }
            await this.stockLedger.postTransaction({
                companyId: user.companyId,
                itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: issue.warehouseId,
                transactionType: 'ISSUE',
                referenceType: 'PRODUCTION_ISSUE',
                referenceId: issue.id, referenceNumber: issue.issueNumber,
                outQty: item.issuedQty, unitCost: item.unitCost,
                remarks: `Production issue for ${issue.workOrderId}`,
                userId: user.id,
            });
            if (item.batchId) {
                await this.prisma.stockBatch.update({
                    where: { id: item.batchId },
                    data: { availableQty: { decrement: item.issuedQty }, updatedBy: user.id },
                });
            }
        }
        const updated = await this.prisma.productionIssue.update({
            where: { id }, data: { status: 'ISSUED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'production_issues', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status, workOrderId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ issueNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        if (workOrderId)
            where.workOrderId = workOrderId;
        const [data, total] = await Promise.all([
            this.prisma.productionIssue.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    workOrder: { select: { woNumber: true, productName: true } },
                    warehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.productionIssue.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const issue = await this.prisma.productionIssue.findFirst({ where, include: this.includes() });
        if (!issue)
            throw new common_1.NotFoundException('Production issue not found');
        return issue;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, draft, issued] = await Promise.all([
            this.prisma.productionIssue.count({ where }),
            this.prisma.productionIssue.count({ where: Object.assign(Object.assign({}, where), { status: 'DRAFT' }) }),
            this.prisma.productionIssue.count({ where: Object.assign(Object.assign({}, where), { status: 'ISSUED' }) }),
        ]);
        const totalQty = await this.prisma.productionIssueItem.aggregate({
            where: { companyId: where.companyId }, _sum: { issuedQty: true },
        });
        return { total, draft, issued, totalQtyIssued: totalQty._sum.issuedQty || 0 };
    }
};
exports.ProductionIssueService = ProductionIssueService;
exports.ProductionIssueService = ProductionIssueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService,
        mrp_service_1.MrpService])
], ProductionIssueService);
//# sourceMappingURL=production-issue.service.js.map