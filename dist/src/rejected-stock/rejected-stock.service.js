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
exports.RejectedStockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RejectedStockService = class RejectedStockService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.rejectedStock.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `REJ-${year}-${String(count + 1).padStart(4, '0')}`;
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
            include: {
                items: { where: { isActive: true, rejectedQty: { gt: 0 } } },
                grn: true,
            },
        });
        if (!iqc)
            throw new common_1.NotFoundException('IQC not found');
        if (iqc.status !== 'APPROVED')
            throw new common_1.BadRequestException('IQC must be APPROVED');
        const rejectedItems = iqc.items.filter(i => i.rejectedQty > 0);
        if (rejectedItems.length === 0)
            throw new common_1.BadRequestException('No rejected items in this IQC');
        const existing = await this.prisma.rejectedStock.findFirst({ where: { iqcId, companyId: user.companyId } });
        if (existing)
            throw new common_1.BadRequestException('Rejection record already exists for this IQC');
        const grn = iqc.grn;
        const rejectionNumber = await this.generateNumber(user.companyId);
        const totalRejectedQty = rejectedItems.reduce((s, i) => s + i.rejectedQty, 0);
        const rejected = await this.prisma.rejectedStock.create({
            data: {
                rejectionNumber,
                iqcId,
                grnId: grn.id,
                warehouseId: grn.warehouseId,
                totalRejectedQty,
                companyId: user.companyId,
                createdBy: user.id, updatedBy: user.id,
                items: {
                    create: rejectedItems.map(item => ({
                        iqcItemId: item.id,
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        uom: item.uom,
                        rejectedQty: item.rejectedQty,
                        rejectionReason: item.rejectionReason,
                        companyId: user.companyId,
                        createdBy: user.id, updatedBy: user.id,
                    })),
                },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'rejected_stock', recordId: rejected.id, action: 'CREATE', newValues: rejected, changedBy: user.id });
        return rejected;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ rejectionNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.rejectedStock.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    iqc: { select: { iqcNumber: true } },
                    grn: { select: { grnNumber: true } },
                    warehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.rejectedStock.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const rec = await this.prisma.rejectedStock.findFirst({ where, include: this.includes() });
        if (!rec)
            throw new common_1.NotFoundException('Rejected stock record not found');
        return rec;
    }
    async disposeItem(id, itemId, dto, user) {
        const rec = await this.findOne(id, user);
        if (rec.status === 'CLOSED')
            throw new common_1.BadRequestException('Cannot update closed rejection record');
        const item = rec.items.find(i => i.id === itemId);
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        await this.prisma.rejectedStockItem.update({
            where: { id: itemId },
            data: {
                disposition: dto.disposition,
                dispositionDate: new Date(),
                dispositionBy: dto.dispositionBy || user.id,
                dispositionNotes: dto.dispositionNotes,
                updatedBy: user.id,
            },
        });
        const updated = await this.findOne(id, user);
        const allDispositioned = updated.items.every(i => i.disposition !== 'PENDING');
        const someDispositioned = updated.items.some(i => i.disposition !== 'PENDING');
        let newStatus = rec.status;
        if (allDispositioned)
            newStatus = 'PARTIALLY_DISPOSITIONED';
        else if (someDispositioned)
            newStatus = 'PARTIALLY_DISPOSITIONED';
        await this.prisma.rejectedStock.update({
            where: { id }, data: { status: newStatus, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: { itemId, disposition: dto.disposition }, changedBy: user.id });
        return this.findOne(id, user);
    }
    async close(id, user) {
        const rec = await this.findOne(id, user);
        const pendingItems = rec.items.filter(i => i.disposition === 'PENDING');
        if (pendingItems.length > 0)
            throw new common_1.BadRequestException(`${pendingItems.length} item(s) still pending disposition`);
        const updated = await this.prisma.rejectedStock.update({
            where: { id }, data: { status: 'CLOSED', updatedBy: user.id }, include: this.includes(),
        });
        await this.audit.log({ tableName: 'rejected_stock', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, quarantined, closed] = await Promise.all([
            this.prisma.rejectedStock.count({ where }),
            this.prisma.rejectedStock.count({ where: Object.assign(Object.assign({}, where), { status: 'QUARANTINED' }) }),
            this.prisma.rejectedStock.count({ where: Object.assign(Object.assign({}, where), { status: 'CLOSED' }) }),
        ]);
        const totalQty = await this.prisma.rejectedStock.aggregate({ where, _sum: { totalRejectedQty: true } });
        const byDisposition = await this.prisma.rejectedStockItem.groupBy({
            by: ['disposition'], where: { companyId: where.companyId }, _count: true, _sum: { rejectedQty: true },
        });
        return { total, quarantined, closed, totalRejectedQty: totalQty._sum.totalRejectedQty || 0, byDisposition };
    }
};
exports.RejectedStockService = RejectedStockService;
exports.RejectedStockService = RejectedStockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], RejectedStockService);
//# sourceMappingURL=rejected-stock.service.js.map