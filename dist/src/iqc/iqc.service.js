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
exports.IqcService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
let IqcService = class IqcService {
    constructor(prisma, audit, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.stockLedger = stockLedger;
    }
    async generateIqcNumber(companyId) {
        const count = await this.prisma.iqcInspection.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `IQC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    includes() {
        return {
            grn: { select: { grnNumber: true, grnType: true, warehouseId: true, warehouse: { select: { name: true } } } },
            items: { where: { isActive: true } },
        };
    }
    async create(dto, user) {
        const grn = await this.prisma.grnHeader.findFirst({
            where: { id: dto.grnId, companyId: user.companyId },
            include: { items: { where: { isActive: true } } },
        });
        if (!grn)
            throw new common_1.NotFoundException('GRN not found');
        if (grn.status !== 'IQC_PENDING')
            throw new common_1.BadRequestException('GRN must be in IQC_PENDING status');
        const existing = await this.prisma.iqcInspection.findFirst({ where: { grnId: dto.grnId, companyId: user.companyId } });
        if (existing)
            throw new common_1.BadRequestException('IQC inspection already exists for this GRN');
        const itemCodes = grn.items.map(i => i.itemCode);
        const [rawMaterials, products] = await Promise.all([
            this.prisma.rawMaterial.findMany({ where: { companyId: user.companyId, code: { in: itemCodes } }, select: { code: true, iqcRequired: true } }),
            this.prisma.product.findMany({ where: { companyId: user.companyId, code: { in: itemCodes } }, select: { code: true, iqcRequired: true } }),
        ]);
        const iqcRequiredByCode = new Map();
        for (const rm of rawMaterials)
            iqcRequiredByCode.set(rm.code, rm.iqcRequired);
        for (const p of products)
            if (!iqcRequiredByCode.has(p.code))
                iqcRequiredByCode.set(p.code, p.iqcRequired);
        const requiresIqc = (itemCode) => { var _a; return (_a = iqcRequiredByCode.get(itemCode)) !== null && _a !== void 0 ? _a : true; };
        const iqcLines = grn.items.filter(item => requiresIqc(item.itemCode));
        const skippedLines = grn.items.filter(item => !requiresIqc(item.itemCode));
        for (const item of skippedLines) {
            const availableQty = item.receivedQty - (item.heldQty || 0);
            if (availableQty <= 0)
                continue;
            await this.prisma.grnItem.update({
                where: { id: item.id },
                data: { acceptedQty: availableQty, rejectedQty: 0, updatedBy: user.id },
            });
            await this.stockLedger.postTransaction({
                companyId: user.companyId, itemCode: item.itemCode, itemName: item.itemName,
                warehouseId: grn.warehouseId, transactionType: 'GRN_DIRECT_ACCEPT',
                referenceType: 'GRN', referenceId: grn.id, referenceNumber: grn.grnNumber,
                inQty: availableQty, remarks: 'IQC not required for this material - accepted directly per material master configuration',
                userId: user.id,
            });
            await this.audit.log({
                tableName: 'grn_items', recordId: item.id, action: 'UPDATE',
                newValues: { acceptedQty: availableQty, reason: 'IQC_NOT_REQUIRED' }, changedBy: user.id,
            });
        }
        if (iqcLines.length === 0) {
            const updatedGrn = await this.prisma.grnHeader.update({
                where: { id: grn.id }, data: { status: 'ACCEPTED', updatedBy: user.id },
            });
            await this.audit.log({ tableName: 'grn_headers', recordId: grn.id, action: 'UPDATE', newValues: { status: 'ACCEPTED', reason: 'ALL_LINES_IQC_NOT_REQUIRED' }, changedBy: user.id });
            return { skippedIqc: true, grn: updatedGrn };
        }
        const iqcNumber = await this.generateIqcNumber(user.companyId);
        const iqc = await this.prisma.iqcInspection.create({
            data: {
                iqcNumber,
                grnId: dto.grnId,
                inspectedBy: dto.inspectedBy,
                remarks: dto.remarks,
                status: 'IN_PROGRESS',
                companyId: user.companyId,
                createdBy: user.id, updatedBy: user.id,
                items: {
                    create: iqcLines.map(item => {
                        const availableForIqc = item.receivedQty - (item.heldQty || 0);
                        return {
                            grnItemId: item.id,
                            itemCode: item.itemCode,
                            itemName: item.itemName,
                            uom: item.uom,
                            receivedQty: availableForIqc,
                            acceptedQty: availableForIqc,
                            rejectedQty: 0,
                            companyId: user.companyId,
                            createdBy: user.id, updatedBy: user.id,
                        };
                    }),
                },
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'iqc_inspections', recordId: iqc.id, action: 'CREATE', newValues: iqc, changedBy: user.id });
        return iqc;
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        if (search)
            where.OR = [{ iqcNumber: { contains: search, mode: 'insensitive' } }];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.iqcInspection.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                include: {
                    grn: { select: { grnNumber: true, grnType: true, warehouse: { select: { name: true } } } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.iqcInspection.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const where = { id };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const iqc = await this.prisma.iqcInspection.findFirst({ where, include: this.includes() });
        if (!iqc)
            throw new common_1.NotFoundException('IQC inspection not found');
        return iqc;
    }
    async findByGrn(grnId, user) {
        const where = { grnId };
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        return this.prisma.iqcInspection.findMany({ where, include: this.includes() });
    }
    async updateItems(id, dto, user) {
        const iqc = await this.findOne(id, user);
        if (iqc.status === 'APPROVED')
            throw new common_1.BadRequestException('Cannot edit approved IQC');
        for (const itemUpdate of dto.items) {
            const iqcItem = iqc.items.find((i) => i.id === itemUpdate.id);
            if (!iqcItem)
                throw new common_1.BadRequestException(`IQC item ${itemUpdate.id} not found`);
            if (itemUpdate.acceptedQty + itemUpdate.rejectedQty > iqcItem.receivedQty) {
                throw new common_1.BadRequestException(`Item ${iqcItem.itemCode}: accepted + rejected cannot exceed received qty`);
            }
            await this.prisma.iqcItem.update({
                where: { id: itemUpdate.id },
                data: {
                    acceptedQty: itemUpdate.acceptedQty,
                    rejectedQty: itemUpdate.rejectedQty,
                    rejectionReason: itemUpdate.rejectionReason,
                    updatedBy: user.id,
                },
            });
        }
        const updated = await this.findOne(id, user);
        await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async approve(id, user) {
        const iqc = await this.findOne(id, user);
        if (iqc.status === 'APPROVED')
            throw new common_1.BadRequestException('Already approved');
        if (iqc.status === 'PENDING')
            throw new common_1.BadRequestException('IQC must be IN_PROGRESS before approval');
        for (const item of iqc.items) {
            if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
                throw new common_1.BadRequestException(`Item ${item.itemCode}: quantities don't balance`);
            }
        }
        await this.prisma.iqcInspection.update({
            where: { id }, data: { status: 'APPROVED', updatedBy: user.id },
        });
        await this.stockLedger.receiveFromIqc(id, user);
        for (const item of iqc.items) {
            await this.prisma.grnItem.update({
                where: { id: item.grnItemId },
                data: { acceptedQty: item.acceptedQty, rejectedQty: item.rejectedQty, updatedBy: user.id },
            });
        }
        const totalAccepted = iqc.items.reduce((s, i) => s + i.acceptedQty, 0);
        const totalReceived = iqc.items.reduce((s, i) => s + i.receivedQty, 0);
        const totalRejected = iqc.items.reduce((s, i) => s + i.rejectedQty, 0);
        let grnStatus = 'ACCEPTED';
        if (totalRejected > 0 && totalAccepted > 0)
            grnStatus = 'PARTIALLY_ACCEPTED';
        else if (totalRejected === totalReceived)
            grnStatus = 'ACCEPTED';
        await this.prisma.grnHeader.update({
            where: { id: iqc.grnId }, data: { status: grnStatus, updatedBy: user.id },
        });
        const result = await this.findOne(id, user);
        await this.audit.log({ tableName: 'iqc_inspections', recordId: id, action: 'UPDATE', newValues: result, changedBy: user.id });
        return result;
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const [total, pending, inProgress, approved] = await Promise.all([
            this.prisma.iqcInspection.count({ where }),
            this.prisma.iqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            this.prisma.iqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'IN_PROGRESS' }) }),
            this.prisma.iqcInspection.count({ where: Object.assign(Object.assign({}, where), { status: 'APPROVED' }) }),
        ]);
        return { total, pending, inProgress, approved };
    }
};
exports.IqcService = IqcService;
exports.IqcService = IqcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService, stock_ledger_service_1.StockLedgerService])
], IqcService);
//# sourceMappingURL=iqc.service.js.map