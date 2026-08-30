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
exports.GateInwardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
const settings_service_1 = require("../settings/settings.service");
const vehicle_management_service_1 = require("../vehicle-management/vehicle-management.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let GateInwardService = class GateInwardService {
    constructor(prisma, audit, settings, vehicleManagement, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.settings = settings;
        this.vehicleManagement = vehicleManagement;
        this.notifications = notifications;
    }
    async create(dto, user) {
        var _a, _b, _c, _d, _e;
        const plant = await this.prisma.plant.findUnique({ where: { id: dto.plantId } });
        if (!plant)
            throw new common_1.NotFoundException('Plant not found');
        const hasFlatMaterial = !!dto.materialDescription && dto.quantity != null;
        const hasItems = Array.isArray(dto.items) && dto.items.length > 0;
        if (!hasFlatMaterial && !hasItems) {
            throw new common_1.BadRequestException('Provide either materialDescription + quantity, or a list of items');
        }
        if (dto.poId) {
            const recentDuplicate = await this.prisma.gateInwardEntry.findFirst({
                where: {
                    companyId: user.companyId,
                    poId: dto.poId,
                    isActive: true,
                    createdAt: { gte: new Date(Date.now() - 60 * 1000) },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (recentDuplicate) {
                throw new common_1.BadRequestException(`A Gate Inward entry (${recentDuplicate.ginNumber}) was already created for this PO less than a minute ago. ` +
                    `If this is a genuinely separate delivery, please wait a moment and try again.`);
            }
        }
        if (dto.vehicleNumber) {
            const activeForVehicle = await this.prisma.gateInwardEntry.findFirst({
                where: {
                    companyId: user.companyId,
                    vehicleNumber: dto.vehicleNumber,
                    isActive: true,
                    status: { in: ['PENDING', 'VERIFIED', 'GATE_IN'] },
                },
            });
            if (activeForVehicle) {
                throw new common_1.BadRequestException(`Vehicle ${dto.vehicleNumber} already has an active Gate Inward entry (${activeForVehicle.ginNumber}, status: ${activeForVehicle.status}). Complete or reject that one first.`);
            }
        }
        let resolvedVehicleLogId = dto.vehicleLogId;
        if (!resolvedVehicleLogId && dto.vehicleNumber) {
            const autoLog = await this.vehicleManagement.findOrCreateActiveLog({
                vehicleNumber: dto.vehicleNumber,
                driverName: dto.driverName,
                plantId: dto.plantId,
                purpose: 'INWARD',
                companyId: user.companyId,
                userId: user.id,
                materialDescription: dto.materialDescription,
                supplierName: dto.supplierName,
                poNumber: dto.poNumber,
            });
            resolvedVehicleLogId = autoLog.id;
        }
        let ginNumber;
        try {
            ginNumber = await this.settings.getNextNumber(user.companyId, 'GIN');
        }
        catch (_f) {
            const count = await this.prisma.gateInwardEntry.count({ where: { companyId: user.companyId } });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            ginNumber = `GIN-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        let resolvedPoNumber = dto.poNumber;
        let resolvedPoId = dto.poId;
        let initialStatus = client_1.GateInwardStatus.PENDING;
        let holdBecausePoNotFound = false;
        let holdBecausePoInvalidStatus = false;
        let holdBecauseVendorMismatch = false;
        let resolvedPoForNotification = null;
        let mismatchForNotification = null;
        const checkVendorMismatch = (poVendorName) => {
            const supplierLower = dto.supplierName.trim().toLowerCase();
            const vendorLower = poVendorName.trim().toLowerCase();
            if (!supplierLower.includes(vendorLower) && !vendorLower.includes(supplierLower)) {
                holdBecauseVendorMismatch = true;
                initialStatus = client_1.GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH;
                mismatchForNotification = { expected: poVendorName, actual: dto.supplierName };
            }
        };
        const resolvePoStatusHold = (status) => {
            if (status === 'CANCELLED') {
                initialStatus = client_1.GateInwardStatus.GATE_HOLD_PO_CANCELLED;
                return true;
            }
            if (status === 'CLOSED') {
                initialStatus = client_1.GateInwardStatus.GATE_HOLD_PO_CLOSED;
                return true;
            }
            return false;
        };
        if (dto.poId) {
            const po = await this.prisma.purchaseOrder.findFirst({
                where: { id: dto.poId, companyId: user.companyId },
                include: { vendor: { select: { name: true } } },
            });
            if (!po)
                throw new common_1.NotFoundException('Purchase Order not found');
            resolvedPoNumber = po.poNumber;
            resolvedPoId = po.id;
            if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
                holdBecausePoInvalidStatus = resolvePoStatusHold(po.status);
                if (holdBecausePoInvalidStatus)
                    resolvedPoForNotification = { poNumber: po.poNumber, status: po.status };
                if (!holdBecausePoInvalidStatus) {
                    throw new common_1.BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
                }
            }
            else {
                checkVendorMismatch(po.vendor.name);
            }
        }
        else if ((_a = dto.poNumber) === null || _a === void 0 ? void 0 : _a.trim()) {
            const matchedPo = await this.prisma.purchaseOrder.findFirst({
                where: { companyId: user.companyId, poNumber: dto.poNumber.trim() },
                include: { vendor: { select: { name: true } } },
            });
            if (matchedPo) {
                resolvedPoId = matchedPo.id;
                resolvedPoNumber = matchedPo.poNumber;
                if (!['SENT', 'PARTIALLY_RECEIVED'].includes(matchedPo.status)) {
                    holdBecausePoInvalidStatus = resolvePoStatusHold(matchedPo.status);
                    if (holdBecausePoInvalidStatus)
                        resolvedPoForNotification = { poNumber: matchedPo.poNumber, status: matchedPo.status };
                    if (!holdBecausePoInvalidStatus) {
                        throw new common_1.BadRequestException(`This PO is ${matchedPo.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
                    }
                }
                else {
                    checkVendorMismatch(matchedPo.vendor.name);
                }
            }
            else {
                holdBecausePoNotFound = true;
                initialStatus = client_1.GateInwardStatus.GATE_HOLD_PO_NOT_FOUND;
            }
        }
        const materialDescription = (_b = dto.materialDescription) !== null && _b !== void 0 ? _b : (hasItems ? dto.items.map((i) => i.itemName).join(', ') : undefined);
        const quantity = (_c = dto.quantity) !== null && _c !== void 0 ? _c : (hasItems ? dto.items.reduce((s, i) => s + i.quantity, 0) : undefined);
        const itemsPackageTotal = hasItems
            ? dto.items.reduce((s, i) => s + (i.packageCount || 0), 0)
            : 0;
        const packageCount = (_d = dto.packageCount) !== null && _d !== void 0 ? _d : (itemsPackageTotal > 0 ? itemsPackageTotal : undefined);
        const entry = await this.prisma.gateInwardEntry.create({
            data: {
                ginNumber,
                companyId: user.companyId,
                plantId: dto.plantId,
                vehicleLogId: resolvedVehicleLogId,
                vehicleNumber: dto.vehicleNumber,
                driverName: dto.driverName,
                supplierName: dto.supplierName,
                supplierMobile: dto.supplierMobile,
                supplierGstin: dto.supplierGstin,
                poId: resolvedPoId,
                poNumber: resolvedPoNumber,
                status: initialStatus,
                mismatchType: holdBecauseVendorMismatch ? 'VENDOR' : undefined,
                mismatchExpectedValue: mismatchForNotification === null || mismatchForNotification === void 0 ? void 0 : mismatchForNotification.expected,
                mismatchActualValue: mismatchForNotification === null || mismatchForNotification === void 0 ? void 0 : mismatchForNotification.actual,
                mismatchFlaggedAt: holdBecauseVendorMismatch ? new Date() : undefined,
                invoiceNumber: dto.invoiceNumber,
                invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
                invoiceAmount: dto.invoiceAmount,
                materialDescription,
                quantity,
                unit: (_e = dto.unit) !== null && _e !== void 0 ? _e : 'NOS',
                grossWeight: dto.grossWeight,
                netWeight: dto.netWeight,
                packageCount,
                remarks: dto.remarks,
                receivedById: user.id,
                createdBy: user.id,
                updatedBy: user.id,
                items: hasItems ? {
                    create: dto.items.map((i) => {
                        var _a;
                        return ({
                            companyId: user.companyId,
                            poItemId: i.poItemId,
                            itemCode: i.itemCode,
                            itemName: i.itemName,
                            uom: (_a = i.uom) !== null && _a !== void 0 ? _a : 'NOS',
                            quantity: i.quantity,
                            packageCount: i.packageCount,
                            remarks: i.remarks,
                            createdBy: user.id,
                            updatedBy: user.id,
                        });
                    }),
                } : undefined,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: entry.id, action: 'CREATE', newValues: { ginNumber, supplierName: dto.supplierName }, changedBy: user.id });
        if (holdBecausePoNotFound) {
            await this.notifyPurchaseOfHold(entry, user);
        }
        if (holdBecausePoInvalidStatus && resolvedPoForNotification) {
            await this.notifyPurchaseOfPoStatusHold(entry, resolvedPoForNotification, user);
        }
        if (holdBecauseVendorMismatch && mismatchForNotification) {
            await this.notifyOfMismatchHold(entry, 'VENDOR', mismatchForNotification, user);
        }
        return entry;
    }
    async notifyPurchaseOfHold(entry, actorUser) {
        const purchaseUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (purchaseUsers.length === 0)
            return;
        await this.notifications.createBulk(purchaseUsers.map(u => ({
            userId: u.id,
            type: 'GATE_HOLD_PO_NOT_FOUND',
            title: 'Gate Hold — PO Not Found',
            message: `${entry.ginNumber} — ${entry.supplierName} — references PO "${entry.poNumber}" which could not be found. Material is on hold at the gate pending your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async notifyPurchaseOfPoStatusHold(entry, po, actorUser) {
        const purchaseUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (purchaseUsers.length === 0)
            return;
        await this.notifications.createBulk(purchaseUsers.map(u => ({
            userId: u.id,
            type: po.status === 'CANCELLED' ? 'GATE_HOLD_PO_CANCELLED' : 'GATE_HOLD_PO_CLOSED',
            title: `Gate Hold — PO ${po.status}`,
            message: `${entry.ginNumber} — ${entry.supplierName} — references PO ${po.poNumber} which is ${po.status}. Material is on hold at the gate pending your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async notifyOfMismatchHold(entry, mismatchType, values, actorUser) {
        const approverUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (approverUsers.length === 0)
            return;
        const labelMap = { VENDOR: 'Vendor', MATERIAL: 'Material', VEHICLE_NUMBER: 'Vehicle Number', CHALLAN: 'Challan', QUANTITY_EXCESS: 'Excess Material' };
        const label = labelMap[mismatchType];
        const notifTypeMap = { VENDOR: 'GATE_HOLD_VENDOR_MISMATCH', MATERIAL: 'GATE_HOLD_MATERIAL_MISMATCH', VEHICLE_NUMBER: 'GATE_HOLD_VEHICLE_NUMBER_MISMATCH', CHALLAN: 'GATE_HOLD_CHALLAN_MISMATCH', QUANTITY_EXCESS: 'GATE_HOLD_EXCESS_MATERIAL' };
        await this.notifications.createBulk(approverUsers.map(u => ({
            userId: u.id,
            type: notifTypeMap[mismatchType],
            title: `Gate Hold — ${label} Mismatch`,
            message: `${entry.ginNumber} — ${entry.supplierName} — ${label.toLowerCase()} mismatch. Expected: "${values.expected}", Actual: "${values.actual}". Material is on hold at the gate pending your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async findAll(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.plantId)
            where.plantId = filters.plantId;
        if (filters.search) {
            where.OR = [
                { ginNumber: { contains: filters.search, mode: 'insensitive' } },
                { supplierName: { contains: filters.search, mode: 'insensitive' } },
                { poNumber: { contains: filters.search, mode: 'insensitive' } },
                { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
                { materialDescription: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.date) {
            const d = new Date(filters.date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            where.createdAt = { gte: d, lt: next };
        }
        return this.prisma.gateInwardEntry.findMany({ where, include: this.includes(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        return entry;
    }
    async update(id, dto, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (!['PENDING'].includes(entry.status))
            throw new common_1.BadRequestException('Only PENDING entries can be updated');
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id }, data: Object.assign(Object.assign({}, dto), { updatedBy: user.id }), include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: entry, newValues: dto, changedBy: user.id });
        return updated;
    }
    async verify(id, dto, user) {
        var _a, _b, _c, _d;
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: { po: true } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status === client_1.GateInwardStatus.GATE_HOLD_PO_NOT_FOUND) {
            throw new common_1.BadRequestException('This entry is on a Gate Hold — PO Not Found. It cannot be verified until Purchase resolves the hold.');
        }
        if (entry.status !== client_1.GateInwardStatus.PENDING)
            throw new common_1.BadRequestException('Only PENDING entries can be verified');
        const missing = [];
        if (!((_a = entry.supplierName) === null || _a === void 0 ? void 0 : _a.trim()))
            missing.push('Vendor');
        if (!((_b = entry.invoiceNumber) === null || _b === void 0 ? void 0 : _b.trim()))
            missing.push('Challan/Invoice Number');
        if (!entry.vehicleLogId && !entry.vehicleNumber)
            missing.push('Vehicle');
        const hasMaterialRef = !!((_c = entry.materialDescription) === null || _c === void 0 ? void 0 : _c.trim()) || (await this.prisma.gateInwardItem.count({ where: { gateInwardEntryId: id, isActive: true } })) > 0;
        if (!hasMaterialRef)
            missing.push('Material reference');
        if (entry.poId) {
            if (!entry.po) {
                missing.push('PO (linked PO no longer found)');
            }
            else if (!['SENT', 'PARTIALLY_RECEIVED'].includes(entry.po.status)) {
                if (entry.po.status === 'CANCELLED' || entry.po.status === 'CLOSED') {
                    const holdStatus = entry.po.status === 'CANCELLED' ? client_1.GateInwardStatus.GATE_HOLD_PO_CANCELLED : client_1.GateInwardStatus.GATE_HOLD_PO_CLOSED;
                    const held = await this.prisma.gateInwardEntry.update({
                        where: { id },
                        data: { status: holdStatus, updatedBy: user.id },
                        include: this.includes(),
                    });
                    await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, reason: `PO ${entry.po.poNumber} is now ${entry.po.status}` }, changedBy: user.id });
                    await this.notifyPurchaseOfPoStatusHold(held, entry.po, user);
                    return held;
                }
                throw new common_1.BadRequestException(`Cannot verify - PO ${entry.po.poNumber} is now ${entry.po.status}, no longer valid for receiving. Reject this entry or contact Purchase.`);
            }
        }
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`Cannot mark Document Verified - missing or invalid: ${missing.join(', ')}`);
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: client_1.GateInwardStatus.VERIFIED, verifiedById: user.id, verifiedAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'PENDING' }, newValues: { status: 'VERIFIED', documentChecks: { vendor: true, challan: true, vehicle: true, materialReference: true, poStatus: entry.poId ? (_d = entry.po) === null || _d === void 0 ? void 0 : _d.status : 'N/A' } }, changedBy: user.id });
        return updated;
    }
    async gateIn(id, dto, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.VERIFIED)
            throw new common_1.BadRequestException('Only VERIFIED entries can be let in at the gate');
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: client_1.GateInwardStatus.GATE_IN, gateInById: user.id, gateInAt: new Date(), remarks: dto.remarks || entry.remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'VERIFIED' }, newValues: { status: 'GATE_IN' }, changedBy: user.id });
        await this.notifyStoreReceivingReference(updated, user);
        return updated;
    }
    async notifyStoreReceivingReference(entry, actorUser) {
        const storeUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['STORE_MANAGER', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (storeUsers.length === 0)
            return;
        await this.notifications.createBulk(storeUsers.map(u => ({
            userId: u.id,
            type: 'GATE_INWARD_READY_FOR_STORE',
            title: 'Material ready for receiving',
            message: `${entry.ginNumber} — ${entry.supplierName} — has cleared the gate and is ready for Store to receive.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'MEDIUM',
        })), actorUser.companyId, actorUser.id);
    }
    async sendToStores(id, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.GATE_IN)
            throw new common_1.BadRequestException('Only GATE_IN entries can be sent to stores');
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: client_1.GateInwardStatus.SENT_TO_STORES, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'GATE_IN' }, newValues: { status: 'SENT_TO_STORES' }, changedBy: user.id });
        return updated;
    }
    async complete(id, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.SENT_TO_STORES)
            throw new common_1.BadRequestException('Only SENT_TO_STORES entries can be completed');
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: client_1.GateInwardStatus.COMPLETED, completedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: 'SENT_TO_STORES' }, newValues: { status: 'COMPLETED' }, changedBy: user.id });
        return updated;
    }
    async reject(id, dto, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (['COMPLETED', 'REJECTED'].includes(entry.status))
            throw new common_1.BadRequestException(`Cannot reject a ${entry.status} entry`);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { status: client_1.GateInwardStatus.REJECTED, rejectionReason: dto.rejectionReason, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', rejectionReason: dto.rejectionReason }, changedBy: user.id });
        return updated;
    }
    async assertOnHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.GATE_HOLD_PO_NOT_FOUND) {
            throw new common_1.BadRequestException('This entry is not currently on a PO Not Found hold');
        }
        return entry;
    }
    async resolveHoldWithPo(id, poId, remarks, user) {
        const entry = await this.assertOnHold(id);
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
            throw new common_1.BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING, poId: po.id, poNumber: po.poNumber,
                holdResolution: 'PO_IDENTIFIED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: remarks, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status, poId: entry.poId }, newValues: { status: 'PENDING', poId: po.id, poNumber: po.poNumber, holdResolution: 'PO_IDENTIFIED' }, changedBy: user.id });
        return updated;
    }
    async resolveHoldAsNonPo(id, remarks, user) {
        const entry = await this.assertOnHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'NON_PO_AUTHORIZED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: remarks, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'NON_PO_AUTHORIZED', remarks }, changedBy: user.id });
        return updated;
    }
    async resolveHoldAsRejected(id, rejectionReason, user) {
        const entry = await this.assertOnHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason,
                holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: rejectionReason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', rejectionReason }, changedBy: user.id });
        return updated;
    }
    async assertOnPoStatusHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const validHoldStatuses = [client_1.GateInwardStatus.GATE_HOLD_PO_CANCELLED, client_1.GateInwardStatus.GATE_HOLD_PO_CLOSED];
        if (!validHoldStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('This entry is not currently on a PO Cancelled/Closed hold');
        }
        return entry;
    }
    async resolveReturnMaterial(id, reason, user) {
        const entry = await this.assertOnPoStatusHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason: reason,
                holdResolution: 'RETURN_MATERIAL', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'RETURN_MATERIAL', reason }, changedBy: user.id });
        return updated;
    }
    async resolveApprovedException(id, reason, user) {
        const entry = await this.assertOnPoStatusHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'APPROVED_EXCEPTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION', reason }, changedBy: user.id });
        return updated;
    }
    async resolveCorrectPoReference(id, poId, reason, user) {
        const entry = await this.assertOnPoStatusHold(id);
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id: poId, companyId: user.companyId } });
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
            throw new common_1.BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING, poId: po.id, poNumber: po.poNumber,
                holdResolution: 'CORRECT_PO_REFERENCE', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status, poId: entry.poId }, newValues: { status: 'PENDING', poId: po.id, poNumber: po.poNumber, holdResolution: 'CORRECT_PO_REFERENCE', reason }, changedBy: user.id });
        return updated;
    }
    async flagMismatch(id, mismatchType, expectedValue, actualValue, remarks, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const flaggableStatuses = [client_1.GateInwardStatus.PENDING, client_1.GateInwardStatus.VERIFIED];
        if (!flaggableStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('Can only flag a mismatch before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
        }
        const holdStatusMap = {
            VENDOR: client_1.GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH,
            MATERIAL: client_1.GateInwardStatus.GATE_HOLD_MATERIAL_MISMATCH,
            VEHICLE_NUMBER: client_1.GateInwardStatus.GATE_HOLD_VEHICLE_NUMBER_MISMATCH,
            CHALLAN: client_1.GateInwardStatus.GATE_HOLD_CHALLAN_MISMATCH,
            QUANTITY_EXCESS: client_1.GateInwardStatus.GATE_HOLD_EXCESS_MATERIAL,
        };
        const holdStatus = holdStatusMap[mismatchType];
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: holdStatus,
                mismatchType, mismatchExpectedValue: expectedValue, mismatchActualValue: actualValue,
                mismatchFlaggedById: user.id, mismatchFlaggedAt: new Date(),
                remarks: entry.remarks ? `${entry.remarks} | Mismatch flagged: ${remarks}` : `Mismatch flagged: ${remarks}`,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, mismatchType, expectedValue, actualValue, remarks }, changedBy: user.id });
        await this.notifyOfMismatchHold(updated, mismatchType, { expected: expectedValue, actual: actualValue }, user);
        return updated;
    }
    async assertOnMismatchHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const validHoldStatuses = [client_1.GateInwardStatus.GATE_HOLD_VENDOR_MISMATCH, client_1.GateInwardStatus.GATE_HOLD_MATERIAL_MISMATCH, client_1.GateInwardStatus.GATE_HOLD_VEHICLE_NUMBER_MISMATCH, client_1.GateInwardStatus.GATE_HOLD_CHALLAN_MISMATCH, client_1.GateInwardStatus.GATE_HOLD_EXCESS_MATERIAL];
        if (!validHoldStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('This entry is not currently on a Vendor/Material/Vehicle Number/Challan/Excess Material Mismatch hold');
        }
        return entry;
    }
    async resolveMismatchCorrectReference(id, correctedValue, reason, user) {
        const entry = await this.assertOnMismatchHold(id);
        const correctionData = {
            status: client_1.GateInwardStatus.PENDING,
            holdResolution: 'CORRECT_REFERENCE', holdResolvedById: user.id, holdResolvedAt: new Date(),
            holdResolutionRemarks: reason, updatedBy: user.id,
        };
        if (entry.mismatchType === 'VENDOR')
            correctionData.supplierName = correctedValue;
        else if (entry.mismatchType === 'MATERIAL')
            correctionData.materialDescription = correctedValue;
        else if (entry.mismatchType === 'VEHICLE_NUMBER')
            correctionData.vehicleNumber = correctedValue;
        else if (entry.mismatchType === 'CHALLAN')
            correctionData.invoiceNumber = correctedValue;
        else if (entry.mismatchType === 'QUANTITY_EXCESS')
            correctionData.quantity = parseFloat(correctedValue);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: correctionData,
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'CORRECT_REFERENCE', correctedValue, reason }, changedBy: user.id });
        return updated;
    }
    async resolveMismatchApprovedException(id, reason, user) {
        const entry = await this.assertOnMismatchHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'APPROVED_EXCEPTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_EXCEPTION', reason }, changedBy: user.id });
        return updated;
    }
    async resolveMismatchRejected(id, reason, user) {
        const entry = await this.assertOnMismatchHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason: reason,
                holdResolution: 'REJECTED_AT_GATE', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED_AT_GATE', reason }, changedBy: user.id });
        return updated;
    }
    async flagDamage(id, damageType, description, affectedPackages, gateRecommendation, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const flaggableStatuses = [client_1.GateInwardStatus.PENDING, client_1.GateInwardStatus.VERIFIED];
        if (!flaggableStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('Can only flag damage before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
        }
        const holdStatus = damageType === 'MATERIAL' ? client_1.GateInwardStatus.GATE_HOLD_MATERIAL_DAMAGE : client_1.GateInwardStatus.GATE_HOLD_PACKAGING_DAMAGE;
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: holdStatus,
                damageType, damageDescription: description, affectedPackages, gateRecommendation,
                damageFlaggedById: user.id, damageFlaggedAt: new Date(),
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: holdStatus, damageType, description, affectedPackages, gateRecommendation }, changedBy: user.id });
        await this.notifyOfDamageHold(updated, damageType, user);
        return updated;
    }
    async notifyOfDamageHold(entry, damageType, actorUser) {
        const approverUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['SUPER_ADMIN', 'CORPORATE_ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER', 'QC_MANAGER'] } },
            select: { id: true },
        });
        if (approverUsers.length === 0)
            return;
        const label = damageType === 'MATERIAL' ? 'Material' : 'Packaging';
        await this.notifications.createBulk(approverUsers.map(u => ({
            userId: u.id,
            type: damageType === 'MATERIAL' ? 'GATE_HOLD_MATERIAL_DAMAGE' : 'GATE_HOLD_PACKAGING_DAMAGE',
            title: `Gate Hold — Visible ${label} Damage`,
            message: `${entry.ginNumber} — ${entry.supplierName} — visible ${label.toLowerCase()} damage flagged by Security. Gate recommends: ${entry.gateRecommendation === 'REJECT' ? 'Reject at Gate' : 'Accept under exception for detailed inspection'}. Awaiting your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async assertOnDamageHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const validHoldStatuses = [client_1.GateInwardStatus.GATE_HOLD_MATERIAL_DAMAGE, client_1.GateInwardStatus.GATE_HOLD_PACKAGING_DAMAGE];
        if (!validHoldStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('This entry is not currently on a Material/Packaging Damage hold');
        }
        return entry;
    }
    async resolveDamageReject(id, reason, user) {
        const entry = await this.assertOnDamageHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason: reason,
                holdResolution: 'REJECT', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECT', reason }, changedBy: user.id });
        return updated;
    }
    async resolveDamageAcceptException(id, reason, user) {
        const entry = await this.assertOnDamageHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'ACCEPT_EXCEPTION_FOR_INSPECTION', reason }, changedBy: user.id });
        return updated;
    }
    async recordReturnGateOut(id, remarks, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.REJECTED) {
            throw new common_1.BadRequestException('Return Gate-Out can only be recorded for a rejected entry');
        }
        if (entry.returnGateOutAt) {
            throw new common_1.BadRequestException('Return Gate-Out has already been recorded for this entry');
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { returnGateOutById: user.id, returnGateOutAt: new Date(), returnRemarks: remarks, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { returnGateOutAt: null }, newValues: { returnGateOutAt: updated.returnGateOutAt, remarks }, changedBy: user.id });
        return updated;
    }
    async flagDocumentMissing(id, documentType, reason, user) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const flaggableStatuses = [client_1.GateInwardStatus.PENDING, client_1.GateInwardStatus.VERIFIED];
        if (!flaggableStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('Can only flag a missing document before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
        }
        const label = documentType === 'BOTH' ? 'Challan and Invoice' : documentType === 'CHALLAN' ? 'Challan' : 'Invoice';
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.GATE_HOLD_DOCUMENT_MISSING,
                documentMissingType: documentType,
                mismatchExpectedValue: `${label} document`, mismatchActualValue: 'Not provided at arrival',
                mismatchFlaggedById: user.id, mismatchFlaggedAt: new Date(),
                remarks: entry.remarks ? `${entry.remarks} | Document missing flagged: ${reason}` : `Document missing flagged: ${reason}`,
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'GATE_HOLD_DOCUMENT_MISSING', documentType, reason }, changedBy: user.id });
        await this.notifyOfDocumentMissingHold(updated, documentType, user);
        return updated;
    }
    async notifyOfDocumentMissingHold(entry, documentType, actorUser) {
        const approverUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (approverUsers.length === 0)
            return;
        const label = documentType === 'BOTH' ? 'Challan and Invoice' : documentType === 'CHALLAN' ? 'Challan' : 'Invoice';
        await this.notifications.createBulk(approverUsers.map(u => ({
            userId: u.id,
            type: 'GATE_HOLD_DOCUMENT_MISSING',
            title: 'Gate Hold — Document Missing',
            message: `${entry.ginNumber} — ${entry.supplierName} — arrived without a ${label} document. Material is on hold at the gate pending your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async assertOnDocumentMissingHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.GATE_HOLD_DOCUMENT_MISSING) {
            throw new common_1.BadRequestException('This entry is not currently on a Document Missing hold');
        }
        return entry;
    }
    async resolveDocumentMissingException(id, reason, user) {
        const entry = await this.assertOnDocumentMissingHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'ACCEPTED_WITH_UNDERTAKING', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'ACCEPTED_WITH_UNDERTAKING', reason }, changedBy: user.id });
        return updated;
    }
    async resolveDocumentMissingReject(id, reason, user) {
        const entry = await this.assertOnDocumentMissingHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason: reason,
                holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', reason }, changedBy: user.id });
        return updated;
    }
    async verifyPackageCount(id, actualPackageCount, user) {
        var _a;
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        const flaggableStatuses = [client_1.GateInwardStatus.PENDING, client_1.GateInwardStatus.VERIFIED];
        if (!flaggableStatuses.includes(entry.status)) {
            throw new common_1.BadRequestException('Can only verify package count before the vehicle is let in at the gate (entry must be PENDING or VERIFIED)');
        }
        const declared = (_a = entry.packageCount) !== null && _a !== void 0 ? _a : 0;
        const difference = actualPackageCount - declared;
        if (difference === 0) {
            const updated = await this.prisma.gateInwardEntry.update({
                where: { id },
                data: { packageCountVerifiedById: user.id, packageCountVerifiedAt: new Date(), updatedBy: user.id },
                include: this.includes(),
            });
            await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: {}, newValues: { packageCountVerified: true, declared, actual: actualPackageCount }, changedBy: user.id });
            return updated;
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.GATE_HOLD_PACKAGE_COUNT_MISMATCH,
                packageCountExpected: declared, packageCountActual: actualPackageCount, packageCountDifference: difference,
                packageCountVerifiedById: user.id, packageCountVerifiedAt: new Date(),
                updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH', expected: declared, actual: actualPackageCount, difference }, changedBy: user.id });
        await this.notifyOfPackageCountHold(updated, user);
        return updated;
    }
    async notifyOfPackageCountHold(entry, actorUser) {
        const approverUsers = await this.prisma.user.findMany({
            where: { companyId: actorUser.companyId, isActive: true, role: { in: ['PURCHASE_MANAGER', 'STORE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true },
        });
        if (approverUsers.length === 0)
            return;
        await this.notifications.createBulk(approverUsers.map(u => ({
            userId: u.id,
            type: 'GATE_HOLD_PACKAGE_COUNT_MISMATCH',
            title: 'Gate Hold — Package Count Mismatch',
            message: `${entry.ginNumber} — ${entry.supplierName} — declared ${entry.packageCountExpected} packages, ${entry.packageCountActual} counted at the gate (difference: ${entry.packageCountDifference > 0 ? '+' : ''}${entry.packageCountDifference}). Awaiting your decision.`,
            referenceType: 'GATE_INWARD_ENTRY', referenceId: entry.id, referenceNumber: entry.ginNumber,
            priority: 'URGENT',
        })), actorUser.companyId, actorUser.id);
    }
    async assertOnPackageCountHold(id) {
        const entry = await this.prisma.gateInwardEntry.findUnique({ where: { id }, include: this.includes() });
        if (!entry)
            throw new common_1.NotFoundException('Gate inward entry not found');
        if (entry.status !== client_1.GateInwardStatus.GATE_HOLD_PACKAGE_COUNT_MISMATCH) {
            throw new common_1.BadRequestException('This entry is not currently on a Package Count Mismatch hold');
        }
        return entry;
    }
    async resolvePackageCountRecount(id, newActualCount, remarks, user) {
        var _a;
        const entry = await this.assertOnPackageCountHold(id);
        const declared = (_a = entry.packageCountExpected) !== null && _a !== void 0 ? _a : 0;
        const difference = newActualCount - declared;
        if (difference === 0) {
            const updated = await this.prisma.gateInwardEntry.update({
                where: { id },
                data: {
                    status: client_1.GateInwardStatus.PENDING,
                    packageCountActual: newActualCount, packageCountDifference: 0,
                    holdResolution: 'RECOUNT_MATCHED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                    holdResolutionRemarks: remarks, updatedBy: user.id,
                },
                include: this.includes(),
            });
            await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'RECOUNT_MATCHED', newActualCount, remarks }, changedBy: user.id });
            return updated;
        }
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { packageCountActual: newActualCount, packageCountDifference: difference, updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { packageCountActual: entry.packageCountActual }, newValues: { packageCountActual: newActualCount, packageCountDifference: difference, remarks }, changedBy: user.id });
        return updated;
    }
    async resolvePackageCountEscalate(id, remarks, user) {
        const entry = await this.assertOnPackageCountHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: { packageCountEscalated: true, packageCountEscalatedAt: new Date(), updatedBy: user.id },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { packageCountEscalated: false }, newValues: { packageCountEscalated: true, remarks }, changedBy: user.id });
        await this.notifyOfPackageCountHold(updated, user);
        return updated;
    }
    async resolvePackageCountApprovedInward(id, reason, user) {
        const entry = await this.assertOnPackageCountHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.PENDING,
                holdResolution: 'APPROVED_INWARD', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'PENDING', holdResolution: 'APPROVED_INWARD', reason }, changedBy: user.id });
        return updated;
    }
    async resolvePackageCountRejected(id, reason, user) {
        const entry = await this.assertOnPackageCountHold(id);
        const updated = await this.prisma.gateInwardEntry.update({
            where: { id },
            data: {
                status: client_1.GateInwardStatus.REJECTED, rejectionReason: reason,
                holdResolution: 'REJECTED', holdResolvedById: user.id, holdResolvedAt: new Date(),
                holdResolutionRemarks: reason, updatedBy: user.id,
            },
            include: this.includes(),
        });
        await this.audit.log({ tableName: 'gate_inward_entries', recordId: id, action: 'UPDATE', oldValues: { status: entry.status }, newValues: { status: 'REJECTED', holdResolution: 'REJECTED', reason }, changedBy: user.id });
        return updated;
    }
    async getStats(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const base = { companyId: user.companyId };
        const [total, pending, verified, sentToStores, completed, rejected, todayIn] = await Promise.all([
            this.prisma.gateInwardEntry.count({ where: base }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'PENDING' }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'VERIFIED' }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'SENT_TO_STORES' }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'COMPLETED' }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { status: 'REJECTED' }) }),
            this.prisma.gateInwardEntry.count({ where: Object.assign(Object.assign({}, base), { createdAt: { gte: today, lt: tomorrow } }) }),
        ]);
        return { total, pending, verified, sentToStores, completed, rejected, todayIn };
    }
    includes() {
        return {
            plant: { select: { id: true, name: true, code: true } },
            receivedBy: { select: { id: true, firstName: true, lastName: true } },
            verifiedBy: { select: { id: true, firstName: true, lastName: true } },
            gateInBy: { select: { id: true, firstName: true, lastName: true } },
            holdResolvedBy: { select: { id: true, firstName: true, lastName: true } },
            vehicleLog: { select: { id: true, logNumber: true, vehicle: { select: { vehicleNumber: true } } } },
            items: { where: { isActive: true } },
        };
    }
};
exports.GateInwardService = GateInwardService;
exports.GateInwardService = GateInwardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        settings_service_1.SettingsService,
        vehicle_management_service_1.VehicleManagementService,
        notifications_service_1.NotificationsService])
], GateInwardService);
//# sourceMappingURL=gate-inward.service.js.map