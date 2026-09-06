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
exports.StoreShortageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const SHORTAGE_RESULTS = ['SHORT_QUANTITY', 'FULL_SHORT'];
let StoreShortageService = class StoreShortageService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.storeShortage.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `SHT-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    outstanding(s) {
        return Math.max(s.shortQty - s.laterReceivedQty - s.approvedShortClosureQty, 0);
    }
    includes() {
        return {
            storeReceivingItem: { include: { storeReceiving: { select: { receivingNumber: true } } } },
            raisedBy: { select: { firstName: true, lastName: true } },
            resolvedBy: { select: { firstName: true, lastName: true } },
        };
    }
    async upsertFromLine(line, user) {
        var _a;
        const isShortage = SHORTAGE_RESULTS.includes(line.result);
        const existing = await this.prisma.storeShortage.findFirst({ where: { storeReceivingItemId: line.id } });
        if (!isShortage) {
            if (existing) {
                await this.prisma.storeShortage.update({ where: { id: existing.id }, data: { isActive: false, updatedBy: user.id } });
                await this.audit.log({ tableName: 'store_shortages', recordId: existing.id, action: 'UPDATE', oldValues: { isActive: true }, newValues: { isActive: false }, changedBy: user.id });
            }
            return null;
        }
        const gateInwardEntryId = line.storeReceiving.gateInwardEntryId;
        const gin = await this.prisma.gateInwardEntry.findUnique({ where: { id: gateInwardEntryId } });
        let poItemId = null;
        if (gin === null || gin === void 0 ? void 0 : gin.poId) {
            const poItem = await this.prisma.purchaseOrderItem.findFirst({ where: { poId: gin.poId, itemCode: line.itemCode } });
            poItemId = (_a = poItem === null || poItem === void 0 ? void 0 : poItem.id) !== null && _a !== void 0 ? _a : null;
        }
        let shortage;
        if (existing) {
            shortage = await this.prisma.storeShortage.update({
                where: { id: existing.id },
                data: {
                    expectedQty: line.expectedQty, actualQty: line.actualVerifiedQty, shortQty: line.shortQty,
                    isActive: true, updatedBy: user.id,
                },
                include: this.includes(),
            });
        }
        else {
            const discrepancyNumber = await this.generateNumber(user.companyId);
            shortage = await this.prisma.storeShortage.create({
                data: {
                    companyId: user.companyId, discrepancyNumber,
                    storeReceivingItemId: line.id, gateInwardEntryId,
                    poId: gin === null || gin === void 0 ? void 0 : gin.poId, poItemId,
                    supplierName: (gin === null || gin === void 0 ? void 0 : gin.supplierName) || '', itemCode: line.itemCode, itemName: line.itemName, uom: line.uom,
                    expectedQty: line.expectedQty, actualQty: line.actualVerifiedQty, shortQty: line.shortQty,
                    shortageType: 'UNKNOWN', status: 'SHORT_DETECTED',
                    raisedById: user.id, createdBy: user.id, updatedBy: user.id,
                },
                include: this.includes(),
            });
        }
        if (!shortage.purchaseNotifiedAt) {
            const purchaseUsers = await this.prisma.user.findMany({
                where: { companyId: user.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
                select: { id: true },
            });
            if (purchaseUsers.length > 0) {
                await this.notifications.createBulk(purchaseUsers.map(u => ({
                    userId: u.id,
                    type: 'STORE_SHORTAGE_DETECTED',
                    title: 'Material shortage detected at Store',
                    message: shortage.discrepancyNumber + ' - ' + shortage.supplierName + ' - ' + shortage.itemName + ': expected ' + shortage.expectedQty + ', received ' + shortage.actualQty + ', short ' + shortage.shortQty + ' ' + shortage.uom + '.',
                    referenceType: 'STORE_SHORTAGE', referenceId: shortage.id, referenceNumber: shortage.discrepancyNumber,
                    priority: 'HIGH',
                })), user.companyId, user.id);
            }
            shortage = await this.prisma.storeShortage.update({
                where: { id: shortage.id },
                data: { purchaseNotifiedAt: new Date(), status: 'PURCHASE_NOTIFIED' },
                include: this.includes(),
            });
        }
        await this.audit.log({
            tableName: 'store_shortages', recordId: shortage.id, action: existing ? 'UPDATE' : 'CREATE',
            newValues: { expectedQty: shortage.expectedQty, actualQty: shortage.actualQty, shortQty: shortage.shortQty },
            changedBy: user.id,
        });
        return shortage;
    }
    async findAll(user, query) {
        const page = parseInt(query === null || query === void 0 ? void 0 : query.page) || 1;
        const limit = parseInt(query === null || query === void 0 ? void 0 : query.limit) || 20;
        const where = { companyId: user.companyId, isActive: true };
        if (query === null || query === void 0 ? void 0 : query.status)
            where.status = query.status;
        const [data, total] = await Promise.all([
            this.prisma.storeShortage.findMany({ where, include: this.includes(), orderBy: { raisedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.storeShortage.count({ where }),
        ]);
        return {
            data: data.map(s => (Object.assign(Object.assign({}, s), { outstandingQty: this.outstanding(s) }))),
            total, page, limit, totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, user) {
        const s = await this.prisma.storeShortage.findFirst({ where: { id, companyId: user.companyId }, include: this.includes() });
        if (!s)
            throw new common_1.NotFoundException('Shortage record not found');
        return Object.assign(Object.assign({}, s), { outstandingQty: this.outstanding(s) });
    }
    async linkBalanceDelivery(shortageId, dto, user) {
        const shortage = await this.prisma.storeShortage.findFirst({ where: { id: shortageId, companyId: user.companyId } });
        if (!shortage)
            throw new common_1.NotFoundException('Shortage record not found');
        const outstanding = this.outstanding(shortage);
        if (dto.qty > outstanding) {
            throw new common_1.BadRequestException('Cannot link ' + dto.qty + ' - only ' + outstanding + ' is outstanding on this shortage');
        }
        const laterLine = await this.prisma.storeReceivingItem.findFirst({ where: { id: dto.laterStoreReceivingItemId, companyId: user.companyId } });
        if (!laterLine)
            throw new common_1.NotFoundException('Later Store Receiving line not found');
        if (laterLine.id === shortage.storeReceivingItemId) {
            throw new common_1.BadRequestException('The balance delivery must be a different (new) Store Receiving line, not the original short receipt');
        }
        const newLaterReceived = shortage.laterReceivedQty + dto.qty;
        const newOutstanding = this.outstanding(Object.assign(Object.assign({}, shortage), { laterReceivedQty: newLaterReceived }));
        const newStatus = newOutstanding === 0 ? 'RESOLVED' : 'PARTIALLY_RESOLVED';
        const oldValues = { laterReceivedQty: shortage.laterReceivedQty, status: shortage.status };
        const updated = await this.prisma.storeShortage.update({
            where: { id: shortageId },
            data: Object.assign({ laterReceivedQty: newLaterReceived, status: newStatus, remarks: dto.remarks, updatedBy: user.id }, (newOutstanding === 0 ? { resolvedById: user.id, resolvedAt: new Date() } : {})),
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'store_shortages', recordId: shortageId, action: 'UPDATE',
            oldValues, newValues: { laterReceivedQty: newLaterReceived, status: newStatus, linkedLaterLine: laterLine.id },
            changedBy: user.id,
        });
        return Object.assign(Object.assign({}, updated), { outstandingQty: newOutstanding });
    }
    async approveShortClosure(shortageId, dto, user) {
        const shortage = await this.prisma.storeShortage.findFirst({ where: { id: shortageId, companyId: user.companyId } });
        if (!shortage)
            throw new common_1.NotFoundException('Shortage record not found');
        const outstanding = this.outstanding(shortage);
        if (dto.qty > outstanding) {
            throw new common_1.BadRequestException('Cannot approve short closure for ' + dto.qty + ' - only ' + outstanding + ' is outstanding on this shortage');
        }
        const newApprovedClosure = shortage.approvedShortClosureQty + dto.qty;
        const newOutstanding = this.outstanding(Object.assign(Object.assign({}, shortage), { approvedShortClosureQty: newApprovedClosure }));
        const newStatus = newOutstanding === 0 ? 'APPROVED_SHORT_CLOSURE' : 'PARTIALLY_RESOLVED';
        const oldValues = { approvedShortClosureQty: shortage.approvedShortClosureQty, status: shortage.status };
        const updated = await this.prisma.storeShortage.update({
            where: { id: shortageId },
            data: {
                approvedShortClosureQty: newApprovedClosure, status: newStatus,
                resolvedById: user.id, resolvedAt: new Date(), remarks: dto.reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({
            tableName: 'store_shortages', recordId: shortageId, action: 'UPDATE',
            oldValues, newValues: { approvedShortClosureQty: newApprovedClosure, status: newStatus, reason: dto.reason },
            changedBy: user.id,
        });
        return Object.assign(Object.assign({}, updated), { outstandingQty: newOutstanding });
    }
};
exports.StoreShortageService = StoreShortageService;
exports.StoreShortageService = StoreShortageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], StoreShortageService);
//# sourceMappingURL=store-shortage.service.js.map