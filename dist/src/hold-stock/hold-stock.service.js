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
exports.HoldStockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
const rejected_stock_service_1 = require("../rejected-stock/rejected-stock.service");
let HoldStockService = class HoldStockService {
    constructor(prisma, audit, stockLedger, rejectedStock) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
        this.rejectedStock = rejectedStock;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.holdStock.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `HOLD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async generateIqcNumber(companyId) {
        const count = await this.prisma.iqcInspection.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `IQC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            iqc: { select: { iqcNumber: true } },
            grn: { select: { grnNumber: true, grnType: true } },
            warehouse: { select: { name: true, code: true } },
            items: { where: { isActive: true } },
        };
    }
    async createFromIqc(iqcId, user) {
        const iqc = await this.prisma.iqcInspection.findFirst({
            where: { id: iqcId, companyId: user.companyId },
            include: { items: { where: { isActive: true, holdQty: { gt: 0 } } }, grn: true },
        });
        if (!iqc)
            throw new common_1.NotFoundException('IQC not found');
        if (iqc.status !== 'APPROVED')
            throw new common_1.BadRequestException('IQC must be APPROVED');
        const heldItems = iqc.items.filter(i => i.holdQty > 0);
        if (heldItems.length === 0)
            throw new common_1.BadRequestException('No held items in this IQC');
        const existing = await this.prisma.holdStock.findFirst({ where: { iqcId, companyId: user.companyId } });
        if (existing)
            throw new common_1.BadRequestException('Hold record already exists for this IQC');
        const grn = iqc.grn;
        const holdNumber = await this.generateNumber(user.companyId);
        const totalHoldQty = heldItems.reduce((s, i) => s + i.holdQty, 0);
        const held = await this.prisma.holdStock.create({
            data: {
                holdNumber, iqcId, grnId: grn.id, warehouseId: grn.warehouseId, totalHoldQty,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: {
                    create: heldItems.map(item => ({
                        iqcItemId: item.id, itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                        holdQty: item.holdQty, holdReason: item.holdReason,
                        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                    })),
                },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'hold_stock', recordId: held.id, action: 'CREATE', newValues: held, changedBy: user.id });
        return held;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ holdNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.holdStock.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    iqc: { select: { iqcNumber: true } },
                    grn: { select: { grnNumber: true } },
                    warehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.holdStock.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const rec = await this.prisma.holdStock.findFirst({ where, include: this.includes() });
        if (!rec)
            throw new common_1.NotFoundException('Hold stock record not found');
        return rec;
    }
    async reinspect(id, itemId, dto, user) {
        const rec = await this.findOne(id, user);
        if (rec.status === 'CLOSED')
            throw new common_1.BadRequestException('Cannot reinspect a closed hold record');
        const item = rec.items.find(i => i.id === itemId);
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        if (item.reinspectionStatus !== 'PENDING')
            throw new common_1.BadRequestException('This item has already been reinspected');
        const total = dto.passQty + dto.failQty;
        if (total <= 0)
            throw new common_1.BadRequestException('Enter a pass or fail quantity');
        if (total > item.holdQty)
            throw new common_1.BadRequestException(`Reinspected qty (${total}) cannot exceed held qty (${item.holdQty})`);
        const reinspectionStatus = dto.failQty === 0 ? 'PASS' : dto.passQty === 0 ? 'FAIL' : 'PARTIAL';
        await this.prisma.holdStockItem.update({
            where: { id: itemId },
            data: {
                reinspectionStatus, reinspectedPassQty: dto.passQty, reinspectedFailQty: dto.failQty,
                reinspectedAt: new Date(), reinspectedBy: user.id, reinspectionNotes: dto.notes, updatedBy: user.id,
            },
        });
        const originalIqcItem = item.iqcItemId ? await this.prisma.iqcItem.findUnique({ where: { id: item.iqcItemId } }) : null;
        const resolvedGrnItemId = originalIqcItem === null || originalIqcItem === void 0 ? void 0 : originalIqcItem.grnItemId;
        const iqcNumber = await this.generateIqcNumber(user.companyId);
        const reinspectionIqc = await this.prisma.iqcInspection.create({
            data: {
                iqcNumber, grnId: rec.grnId, status: 'APPROVED',
                remarks: `Reinspection of ${rec.holdNumber} item ${item.itemCode}${dto.notes ? ' - ' + dto.notes : ''}`,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                items: {
                    create: [{
                            grnItemId: resolvedGrnItemId || item.iqcItemId || itemId,
                            itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                            receivedQty: total, acceptedQty: dto.passQty, rejectedQty: dto.failQty,
                            rejectionReason: dto.failQty > 0 ? `Failed reinspection from hold (${rec.holdNumber})` : undefined,
                            companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
                        }],
                },
            },
        });
        if (dto.passQty > 0) {
            await this.stockLedger.receiveFromIqc(reinspectionIqc.id, user);
        }
        if (dto.failQty > 0) {
            await this.rejectedStock.createFromIqc(reinspectionIqc.id, user);
        }
        const refreshed = await this.findOne(id, user);
        const allDone = refreshed.items.every(i => i.reinspectionStatus !== 'PENDING');
        if (allDone) {
            await this.prisma.holdStock.update({ where: { id }, data: { status: 'CLOSED', updatedBy: user.id } });
        }
        else {
            await this.prisma.holdStock.update({ where: { id }, data: { status: 'PARTIALLY_RELEASED', updatedBy: user.id } });
        }
        await this.audit.log({
            tableName: 'hold_stock', recordId: id, action: 'UPDATE',
            newValues: { itemId, reinspectionStatus, passQty: dto.passQty, failQty: dto.failQty, reinspectionIqcId: reinspectionIqc.id },
            changedBy: user.id,
        });
        return this.findOne(id, user);
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, held, closed] = await Promise.all([
            this.prisma.holdStock.count({ where }),
            this.prisma.holdStock.count({ where: Object.assign(Object.assign({}, where), { status: 'HELD' }) }),
            this.prisma.holdStock.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
        ]);
        const totalQty = await this.prisma.holdStock.aggregate({ where, _sum: { totalHoldQty: true } });
        return { total, held, closed, totalHoldQty: totalQty._sum.totalHoldQty || 0 };
    }
};
exports.HoldStockService = HoldStockService;
exports.HoldStockService = HoldStockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        stock_ledger_service_1.StockLedgerService,
        rejected_stock_service_1.RejectedStockService])
], HoldStockService);
//# sourceMappingURL=hold-stock.service.js.map