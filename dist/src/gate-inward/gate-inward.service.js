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
        var _a, _b, _c, _d;
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
        catch (_e) {
            const count = await this.prisma.gateInwardEntry.count({ where: { companyId: user.companyId } });
            const now = new Date();
            const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            ginNumber = `GIN-${String(fy).slice(2)}-${String(fy + 1).slice(2)}-${String(count + 1).padStart(4, '0')}`;
        }
        let resolvedPoNumber = dto.poNumber;
        let vendorMismatchWarning;
        if (dto.poId) {
            const po = await this.prisma.purchaseOrder.findFirst({
                where: { id: dto.poId, companyId: user.companyId },
                include: { vendor: { select: { name: true } } },
            });
            if (!po)
                throw new common_1.NotFoundException('Purchase Order not found');
            if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
                throw new common_1.BadRequestException(`This PO is ${po.status} - only SENT or PARTIALLY_RECEIVED POs can receive a gate inward entry.`);
            }
            resolvedPoNumber = po.poNumber;
            const supplierLower = dto.supplierName.trim().toLowerCase();
            const vendorLower = po.vendor.name.trim().toLowerCase();
            if (!supplierLower.includes(vendorLower) && !vendorLower.includes(supplierLower)) {
                vendorMismatchWarning = `Supplier name "${dto.supplierName}" does not match this PO's vendor "${po.vendor.name}" - please verify before accepting.`;
            }
        }
        const materialDescription = (_a = dto.materialDescription) !== null && _a !== void 0 ? _a : (hasItems ? dto.items.map((i) => i.itemName).join(', ') : undefined);
        const quantity = (_b = dto.quantity) !== null && _b !== void 0 ? _b : (hasItems ? dto.items.reduce((s, i) => s + i.quantity, 0) : undefined);
        const itemsPackageTotal = hasItems
            ? dto.items.reduce((s, i) => s + (i.packageCount || 0), 0)
            : 0;
        const packageCount = (_c = dto.packageCount) !== null && _c !== void 0 ? _c : (itemsPackageTotal > 0 ? itemsPackageTotal : undefined);
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
                poId: dto.poId,
                poNumber: resolvedPoNumber,
                invoiceNumber: dto.invoiceNumber,
                invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
                invoiceAmount: dto.invoiceAmount,
                materialDescription,
                quantity,
                unit: (_d = dto.unit) !== null && _d !== void 0 ? _d : 'NOS',
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
        return Object.assign(Object.assign({}, entry), { vendorMismatchWarning });
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
            if (!entry.po)
                missing.push('PO (linked PO no longer found)');
            else if (!['SENT', 'PARTIALLY_RECEIVED'].includes(entry.po.status)) {
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