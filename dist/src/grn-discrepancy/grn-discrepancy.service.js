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
const workflows_service_1 = require("../workflows/workflows.service");
const stock_ledger_service_1 = require("../stock-ledger/stock-ledger.service");
const QC_REQUIRED_PROBLEM_TYPES = ['VISIBLE_DAMAGE', 'SPECIFICATION_MISMATCH'];
let GrnDiscrepancyService = class GrnDiscrepancyService {
    constructor(prisma, audit, notifications, workflows, stockLedger) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
        this.workflows = workflows;
        this.stockLedger = stockLedger;
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
    async purchaseReview(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (record.status === 'RESOLVED' || record.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot review a discrepancy that is already ${record.status}`);
        }
        const oldValues = { purchaseStatus: record.purchaseStatus };
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: { purchaseStatus: dto.purchaseStatus, remarks: dto.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            oldValues, newValues: { purchaseStatus: dto.purchaseStatus }, changedBy: user.id,
        });
        return updated;
    }
    async qcReview(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (record.qcStatus !== 'PENDING') {
            throw new common_1.BadRequestException(`This discrepancy is not awaiting QC review (qcStatus is ${record.qcStatus})`);
        }
        const oldValues = { qcStatus: record.qcStatus };
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: { qcStatus: dto.qcStatus, remarks: dto.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            oldValues, newValues: { qcStatus: dto.qcStatus }, changedBy: user.id,
        });
        return updated;
    }
    async requestResolution(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (record.status === 'RESOLVED' || record.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot request resolution for a discrepancy that is already ${record.status}`);
        }
        if (record.resolutionApprovalRequestId) {
            throw new common_1.BadRequestException('A resolution request is already pending for this discrepancy');
        }
        const { request: approvalRequest } = await this.workflows.submit({
            documentType: 'GRN_DISCREPANCY_RESOLUTION',
            documentId: record.id,
            documentNumber: record.discrepancyNumber,
            remarks: dto.reason,
        }, user);
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: {
                resolution: dto.resolution, resolutionApprovalRequestId: approvalRequest.id,
                status: 'PURCHASE_REVIEW', remarks: dto.reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            newValues: { resolution: dto.resolution, resolutionApprovalRequestId: approvalRequest.id }, changedBy: user.id,
        });
        return updated;
    }
    async decideResolution(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (!record.resolutionApprovalRequestId)
            throw new common_1.BadRequestException('No resolution request is pending for this discrepancy');
        await this.workflows.act(record.resolutionApprovalRequestId, { action: dto.action, comments: dto.comments }, user);
        if (dto.action === 'REJECTED') {
            const updated = await this.prisma.grnItemDiscrepancy.update({
                where: { id },
                data: { resolution: null, resolutionApprovalRequestId: null, status: 'OPEN', remarks: dto.comments, updatedBy: user.id },
                include: this.includes(),
            });
            await this.audit.log({
                tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
                newValues: { resolutionDecision: 'REJECTED' }, changedBy: user.id,
            });
            return updated;
        }
        if (record.resolution === 'ACCEPT_AUTHORIZED') {
            const grnItem = await this.prisma.grnItem.findFirst({ where: { id: record.grnItemId } });
            const grn = await this.prisma.grnHeader.findFirst({ where: { id: record.grnId } });
            if (grnItem && grn) {
                await this.prisma.grnItem.update({ where: { id: grnItem.id }, data: { heldQty: { decrement: record.affectedQty }, updatedBy: user.id } });
                await this.stockLedger.postTransaction({
                    companyId: user.companyId, itemCode: record.itemCode, itemName: record.itemName,
                    warehouseId: grn.warehouseId, transactionType: 'DISCREPANCY_RELEASE',
                    referenceType: 'GRN_ITEM_DISCREPANCY', referenceId: record.id, referenceNumber: record.discrepancyNumber,
                    inQty: record.affectedQty, remarks: 'Released to available stock after authorized acceptance of discrepancy ' + record.discrepancyNumber,
                    userId: user.id,
                });
            }
        }
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedById: user.id, resolvedAt: new Date(), remarks: dto.comments, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            newValues: { resolutionDecision: 'APPROVED', resolution: record.resolution }, changedBy: user.id,
        });
        return updated;
    }
    async segregate(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (record.holdBinId)
            throw new common_1.BadRequestException('This discrepancy is already segregated to a bin');
        if (record.status === 'RESOLVED' || record.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot segregate a discrepancy that is already ${record.status}`);
        }
        const grn = await this.prisma.grnHeader.findFirst({ where: { id: record.grnId } });
        const bin = await this.prisma.warehouseBin.findFirst({ where: { id: dto.binId, companyId: user.companyId } });
        if (!bin)
            throw new common_1.NotFoundException('Bin not found');
        if (grn && bin.warehouseId !== grn.warehouseId) {
            throw new common_1.BadRequestException('Selected bin does not belong to the same warehouse as this GRN');
        }
        if (bin.status !== 'EMPTY' && !(bin.status === 'BLOCKED' && bin.itemCode === record.itemCode)) {
            throw new common_1.BadRequestException('Selected bin is not available for hold - it must be empty or already a hold bin for the same item, not normal unrestricted stock');
        }
        const newQty = bin.currentQty + record.affectedQty;
        if (bin.maxQty && newQty > bin.maxQty) {
            throw new common_1.BadRequestException(`Bin ${bin.code} can only hold ${bin.maxQty} but this would bring it to ${newQty}`);
        }
        await this.prisma.warehouseBin.update({
            where: { id: bin.id },
            data: { currentQty: newQty, itemCode: record.itemCode, status: 'BLOCKED', updatedBy: user.id },
        });
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: { holdBinId: bin.id, segregatedById: user.id, segregatedAt: new Date(), status: 'SEGREGATED', updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            newValues: { holdBinId: bin.id, binCode: bin.code, affectedQty: record.affectedQty }, changedBy: user.id,
        });
        return updated;
    }
    async resolveDirect(id, dto, user) {
        const record = await this.prisma.grnItemDiscrepancy.findFirst({ where: { id, companyId: user.companyId } });
        if (!record)
            throw new common_1.NotFoundException('Discrepancy record not found');
        if (record.status === 'RESOLVED' || record.status === 'CANCELLED') {
            throw new common_1.BadRequestException(`Cannot resolve a discrepancy that is already ${record.status}`);
        }
        const updated = await this.prisma.grnItemDiscrepancy.update({
            where: { id },
            data: {
                resolution: dto.resolution, status: 'RESOLVED',
                resolvedById: user.id, resolvedAt: new Date(), remarks: dto.reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'grn_item_discrepancies', recordId: id, action: 'UPDATE',
            newValues: { resolution: dto.resolution, status: 'RESOLVED' }, changedBy: user.id,
        });
        return updated;
    }
};
exports.GrnDiscrepancyService = GrnDiscrepancyService;
exports.GrnDiscrepancyService = GrnDiscrepancyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        workflows_service_1.WorkflowsService,
        stock_ledger_service_1.StockLedgerService])
], GrnDiscrepancyService);
//# sourceMappingURL=grn-discrepancy.service.js.map