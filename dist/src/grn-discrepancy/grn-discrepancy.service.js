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
exports.GrnDiscrepancyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const QC_REQUIRED_PROBLEM_TYPES = ['VISIBLE_DAMAGE', 'SPECIFICATION_MISMATCH'];
let GrnDiscrepancyService = class GrnDiscrepancyService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.grnItemDiscrepancy.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DIS-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    includes() {
        return {
            grnItem: { select: { itemCode: true, itemName: true, uom: true, receivedQty: true, heldQty: true } },
            grn: { select: { grnNumber: true, warehouseId: true, warehouse: { select: { name: true } } } },
            raisedBy: { select: { firstName: true, lastName: true } },
            resolvedBy: { select: { firstName: true, lastName: true } },
        };
    }
    async raise(grnItemId, dto, user) {
        var _a, _b;
        const grnItem = await this.prisma.grnItem.findFirst({
            where: { id: grnItemId, companyId: user.companyId },
            include: { grn: { include: { po: { select: { vendor: { select: { name: true } } } } }, } },
        });
        if (!grnItem)
            throw new common_1.NotFoundException('GRN item not found');
        const grn = grnItem.grn;
        if (grn.status !== 'DRAFT')
            throw new common_1.BadRequestException('Discrepancies can only be raised while the GRN is still DRAFT - before IQC has taken over the line');
        const applicableQty = grnItem.receivedQty - grnItem.heldQty;
        if (dto.affectedQty > applicableQty) {
            throw new common_1.BadRequestException(`Affected qty (${dto.affectedQty}) exceeds the physically applicable quantity still available on this line (${applicableQty})`);
        }
        const discrepancyNumber = await this.generateNumber(user.companyId);
        const qcStatus = QC_REQUIRED_PROBLEM_TYPES.includes(dto.problemType) ? 'PENDING' : 'NOT_REQUIRED';
        const supplierName = ((_b = (_a = grn.po) === null || _a === void 0 ? void 0 : _a.vendor) === null || _b === void 0 ? void 0 : _b.name) || '';
        const [record] = await this.prisma.$transaction([
            this.prisma.grnItemDiscrepancy.create({
                data: {
                    companyId: user.companyId, discrepancyNumber,
                    grnItemId, grnId: grn.id, gateInwardEntryId: grn.gateInwardEntryId, poId: grn.poId,
                    supplierName, itemCode: grnItem.itemCode, itemName: grnItem.itemName, uom: grnItem.uom,
                    physicalItemCode: dto.physicalItemCode, physicalItemName: dto.physicalItemName,
                    physicalSpecification: dto.physicalSpecification, physicalBatch: dto.physicalBatch,
                    affectedQty: dto.affectedQty, problemType: dto.problemType, damageType: dto.damageType,
                    reason: dto.reason, evidence: dto.evidence,
                    qcStatus, status: 'OPEN',
                    raisedById: user.id, createdBy: user.id, updatedBy: user.id,
                },
                include: this.includes(),
            }),
            this.prisma.grnItem.update({
                where: { id: grnItemId },
                data: { heldQty: { increment: dto.affectedQty }, updatedBy: user.id },
            }),
        ]);
        const purchaseUsers = await this.prisma.user.findMany({
            where: { companyId: user.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (purchaseUsers.length > 0) {
            await this.notifications.createBulk(purchaseUsers.map(u => ({
                userId: u.id,
                type: 'STORE_DISCREPANCY_RAISED',
                title: 'Material discrepancy raised at Store',
                message: record.discrepancyNumber + ' - ' + supplierName + ' - ' + record.itemName + ': ' + record.problemType + ', affected ' + record.affectedQty + ' ' + record.uom + '.',
                referenceType: 'GRN_ITEM_DISCREPANCY', referenceId: record.id, referenceNumber: record.discrepancyNumber,
                priority: 'HIGH',
            })), user.companyId, user.id);
        }
        const withNotified = await this.prisma.grnItemDiscrepancy.update({
            where: { id: record.id },
            data: { purchaseNotifiedAt: new Date(), purchaseStatus: 'NOTIFIED' },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: record.id, action: 'CREATE',
            newValues: { itemCode: record.itemCode, problemType: record.problemType, affectedQty: record.affectedQty, qcStatus },
            changedBy: user.id,
        });
        return withNotified;
    }
    async findAll(user, query) {
        const page = parseInt(query === null || query === void 0 ? void 0 : query.page) || 1;
        const limit = parseInt(query === null || query === void 0 ? void 0 : query.limit) || 20;
        const where = { companyId: user.companyId, isActive: true };
        if (query === null || query === void 0 ? void 0 : query.status)
            where.status = query.status;
        if (query === null || query === void 0 ? void 0 : query.grnId)
            where.grnId = query.grnId;
        const [data, total] = await Promise.all([
            this.prisma.grnItemDiscrepancy.findMany({ where, include: this.includes(), orderBy: { raisedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.grnItemDiscrepancy.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const r = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!r)
            throw new common_1.NotFoundException('Discrepancy record not found');
        return r;
    }
    async correct(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (['ACCEPTED', 'REJECTED'].includes(record.qcStatus)) {
            throw new common_1.BadRequestException('This discrepancy has already been inspected by QC - the affected quantity cannot be directly edited. Use a controlled reconciliation instead.');
        }
        const grnItem = await this.prisma.grnItem.findFirst({ where: { id: record.grnItemId } });
        if (!grnItem)
            throw new common_1.NotFoundException('GRN item not found');
        const delta = dto.affectedQty - record.affectedQty;
        const newHeldQty = grnItem.heldQty + delta;
        if (newHeldQty < 0 || dto.affectedQty > (grnItem.receivedQty - grnItem.heldQty + record.affectedQty)) {
            throw new common_1.BadRequestException('Corrected affected qty is invalid against the physically applicable quantity on this line');
        }
        const oldValues = { affectedQty: record.affectedQty };
        const [updated] = await this.prisma.$transaction([
            this.prisma.grnItemDiscrepancy.update({
                where: { id }, data: { affectedQty: dto.affectedQty, remarks: dto.reason, updatedBy: user.id },
                include: this.includes(),
            }),
            this.prisma.grnItem.update({ where: { id: record.grnItemId }, data: { heldQty: newHeldQty, updatedBy: user.id } }),
        ]);
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            oldValues, newValues: { affectedQty: dto.affectedQty, reason: dto.reason },
            changedBy: user.id,
        });
        return updated;
    }
};
exports.GrnDiscrepancyService = GrnDiscrepancyService;
exports.GrnDiscrepancyService = GrnDiscrepancyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], GrnDiscrepancyService);
//# sourceMappingURL=grn-discrepancy.service.js.map