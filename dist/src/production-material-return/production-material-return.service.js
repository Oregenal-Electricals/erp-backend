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
exports.ProductionMaterialReturnService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let ProductionMaterialReturnService = class ProductionMaterialReturnService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.productionMaterialReturn.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `MRET-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    async create(dto, user) {
        const wo = await this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, companyId: user.companyId } });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const warehouse = await this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, companyId: user.companyId } });
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        const returnNumber = await this.generateNumber(user.companyId);
        const record = await this.prisma.productionMaterialReturn.create({
            data: {
                companyId: user.companyId, returnNumber,
                workOrderId: dto.workOrderId, warehouseId: dto.warehouseId,
                itemCode: dto.itemCode, itemName: dto.itemName, uom: dto.uom, qty: dto.qty,
                reason: dto.reason || 'EXCESS_UNUSED', remarks: dto.remarks,
                returnedById: user.id, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.stockLedger.postTransaction({
            companyId: user.companyId, itemCode: dto.itemCode, itemName: dto.itemName,
            warehouseId: dto.warehouseId, transactionType: 'RETURN',
            referenceType: 'PRODUCTION_MATERIAL_RETURN', referenceId: record.id, referenceNumber: returnNumber,
            inQty: dto.qty, remarks: `Returned from WO ${wo.woNumber}: ${dto.reason || 'EXCESS_UNUSED'}`,
            userId: user.id,
        });
        await this.audit.log({
            tableName: 'production_material_returns', recordId: record.id, action: 'CREATE',
            newValues: record, changedBy: user.id,
        });
        return record;
    }
    async getPreviousMaterialStatus(workOrderId, user) {
        var _a;
        const wo = await this.prisma.workOrder.findFirst({
            where: { id: workOrderId, companyId: user.companyId },
            include: { bom: { include: { items: { where: { isActive: true } } } } },
        });
        if (!wo)
            throw new common_1.NotFoundException('Work order not found');
        const [issuedItems, entries, returns] = await Promise.all([
            this.prisma.productionIssueItem.findMany({
                where: { companyId: user.companyId, productionIssue: { workOrderId, status: 'ISSUED' } },
            }),
            this.prisma.productionEntry.findMany({
                where: { companyId: user.companyId, workOrderId, status: 'CONFIRMED' },
                select: { totalQty: true },
            }),
            this.prisma.productionMaterialReturn.findMany({
                where: { companyId: user.companyId, workOrderId, isActive: true },
            }),
        ]);
        const totalProcessedUnits = entries.reduce((s, e) => s + e.totalQty, 0);
        const issuedByItem = new Map();
        for (const it of issuedItems) {
            const key = it.itemCode;
            if (!issuedByItem.has(key))
                issuedByItem.set(key, { itemCode: it.itemCode, itemName: it.itemName, uom: it.uom, issuedQty: 0 });
            issuedByItem.get(key).issuedQty += it.issuedQty;
        }
        const returnedByItem = new Map();
        for (const r of returns) {
            returnedByItem.set(r.itemCode, (returnedByItem.get(r.itemCode) || 0) + r.qty);
        }
        const bomRatioByItem = new Map();
        for (const bi of (((_a = wo.bom) === null || _a === void 0 ? void 0 : _a.items) || [])) {
            bomRatioByItem.set(bi.itemCode, bi.effectiveQty || bi.quantity);
        }
        const items = Array.from(issuedByItem.values()).map(row => {
            const ratio = bomRatioByItem.get(row.itemCode) || 0;
            const standardConsumed = totalProcessedUnits * ratio;
            const returnedQty = returnedByItem.get(row.itemCode) || 0;
            const accountedQty = standardConsumed + returnedQty;
            const outstandingQty = Math.max(0, row.issuedQty - accountedQty);
            return Object.assign(Object.assign({}, row), { standardConsumed: Math.round(standardConsumed * 100) / 100, returnedQty, accountedQty: Math.round(accountedQty * 100) / 100, outstandingQty: Math.round(outstandingQty * 100) / 100, status: outstandingQty > 0.0001 ? 'PENDING' : 'CLEAR' });
        });
        const overallStatus = items.some(i => i.status === 'PENDING') ? 'PENDING' : 'CLEAR';
        return { workOrderId, woNumber: wo.woNumber, items, overallStatus };
    }
};
exports.ProductionMaterialReturnService = ProductionMaterialReturnService;
exports.ProductionMaterialReturnService = ProductionMaterialReturnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService])
], ProductionMaterialReturnService);
//# sourceMappingURL=production-material-return.service.js.map