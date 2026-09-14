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
exports.RtvService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let RtvService = class RtvService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.rtvRequest.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `RTV-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async getEligibleQty(rejectedStockItemId, excludeRtvId = null) {
        const item = await this.prisma.rejectedStockItem.findFirst({ where: { id: rejectedStockItemId } });
        if (!item)
            throw new common_1.NotFoundException('Rejected stock item not found');
        const others = await this.prisma.rtvRequest.findMany({
            where: Object.assign({ rejectedStockItemId, status: { notIn: ['CANCELLED'] } }, (excludeRtvId ? { id: { not: excludeRtvId } } : {})),
        });
        const claimed = others.reduce((s, r) => { var _a; return s + ((_a = r.approvedQty) !== null && _a !== void 0 ? _a : r.requestedQty); }, 0);
        return { item, eligibleQty: Math.max(0, item.rejectedQty - claimed) };
    }
    async request(dto, user) {
        const { item, eligibleQty } = await this.getEligibleQty(dto.rejectedStockItemId);
        if (!['PENDING', 'RTV'].includes(item.disposition)) {
            throw new common_1.BadRequestException(`This rejected line's disposition is ${item.disposition} - only PENDING or already-RTV-dispositioned lines are eligible for a new RTV request.`);
        }
        if (dto.requestedQty > eligibleQty + 0.0001) {
            throw new common_1.BadRequestException(`Requested RTV qty (${dto.requestedQty}) exceeds the eligible remaining rejected quantity (${eligibleQty}) for ${item.itemCode}.`);
        }
        const rejectedStock = await this.prisma.rejectedStock.findFirst({ where: { id: item.rejectedStockId } });
        if (!(rejectedStock === null || rejectedStock === void 0 ? void 0 : rejectedStock.grnId)) {
            throw new common_1.BadRequestException('This rejected line has no traceable GRN/PO - cannot determine the vendor for a Return to Vendor.');
        }
        const grn = await this.prisma.grnHeader.findFirst({ where: { id: rejectedStock.grnId } });
        if (!(grn === null || grn === void 0 ? void 0 : grn.poId)) {
            throw new common_1.BadRequestException('This rejected line\'s GRN has no linked Purchase Order - cannot determine the vendor for a Return to Vendor.');
        }
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id: grn.poId } });
        if (!po)
            throw new common_1.NotFoundException('Original Purchase Order not found');
        const rtvNumber = await this.generateNumber(user.companyId);
        const rtv = await this.prisma.rtvRequest.create({
            data: {
                companyId: user.companyId, rtvNumber,
                rejectedStockItemId: dto.rejectedStockItemId, vendorId: po.vendorId,
                itemCode: item.itemCode, itemName: item.itemName, uom: item.uom,
                reason: dto.reason, requestedQty: dto.requestedQty, remarks: dto.remarks,
                requestedById: user.id, createdBy: user.id, updatedBy: user.id,
            },
        });
        if (item.disposition !== 'RTV') {
            await this.prisma.rejectedStockItem.update({ where: { id: item.id }, data: { disposition: 'RTV', updatedBy: user.id } });
        }
        await this.audit.log({ tableName: 'rtv_requests', recordId: rtv.id, action: 'CREATE', newValues: rtv, changedBy: user.id });
        return rtv;
    }
    async decide(id, dto, user) {
        var _a;
        const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!rtv)
            throw new common_1.NotFoundException('RTV request not found');
        if (rtv.status !== 'DRAFT')
            throw new common_1.BadRequestException(`Only a DRAFT RTV request can be decided (currently ${rtv.status})`);
        if (dto.action === 'REJECTED') {
            const updated = await this.prisma.rtvRequest.update({ where: { id }, data: { status: 'CANCELLED', remarks: dto.comments, updatedBy: user.id } });
            await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
            return updated;
        }
        const approvedQty = (_a = dto.approvedQty) !== null && _a !== void 0 ? _a : rtv.requestedQty;
        if (approvedQty <= 0)
            throw new common_1.BadRequestException('Approved quantity must be greater than 0');
        if (approvedQty > rtv.requestedQty) {
            throw new common_1.BadRequestException(`Approved quantity (${approvedQty}) cannot exceed the requested quantity (${rtv.requestedQty})`);
        }
        const updated = await this.prisma.rtvRequest.update({
            where: { id },
            data: { status: 'AUTHORIZED', approvedQty, authorizedById: user.id, authorizedAt: new Date(), updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async prepare(id, dto, user) {
        const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!rtv)
            throw new common_1.NotFoundException('RTV request not found');
        if (!['AUTHORIZED', 'PICKING'].includes(rtv.status)) {
            throw new common_1.BadRequestException(`Only an AUTHORIZED RTV request can be prepared (currently ${rtv.status})`);
        }
        if (dto.preparedQty > (rtv.approvedQty || 0) + 0.0001) {
            throw new common_1.BadRequestException(`Prepared qty (${dto.preparedQty}) exceeds the approved RTV qty (${rtv.approvedQty}).`);
        }
        const { eligibleQty } = await this.getEligibleQty(rtv.rejectedStockItemId, rtv.id);
        if (dto.preparedQty > eligibleQty + (rtv.approvedQty || 0) - (rtv.approvedQty || 0) + eligibleQty) {
        }
        const updated = await this.prisma.rtvRequest.update({
            where: { id },
            data: { status: 'READY_FOR_GATE_OUT', preparedQty: dto.preparedQty, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async gateOut(id, dto, user) {
        const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!rtv)
            throw new common_1.NotFoundException('RTV request not found');
        if (!['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'].includes(rtv.status)) {
            throw new common_1.BadRequestException(`RTV request is not ready for Gate-Out (currently ${rtv.status})`);
        }
        const remaining = rtv.preparedQty - rtv.gateOutQty;
        if (dto.qty > remaining + 0.0001) {
            throw new common_1.BadRequestException(`Gate-Out qty (${dto.qty}) exceeds what remains prepared for outward (${remaining}).`);
        }
        const item = await this.prisma.rejectedStockItem.findFirst({ where: { id: rtv.rejectedStockItemId } });
        if (!item || item.rejectedQty < dto.qty - 0.0001) {
            throw new common_1.BadRequestException(`Cannot Gate-Out ${dto.qty} of ${rtv.itemCode} - only ${(item === null || item === void 0 ? void 0 : item.rejectedQty) || 0} remains in rejected plant custody.`);
        }
        await this.prisma.rtvGateOut.create({
            data: {
                companyId: user.companyId, rtvRequestId: id, qty: dto.qty,
                vehicleNumber: dto.vehicleNumber, challanNumber: dto.challanNumber, remarks: dto.remarks,
                gatedOutById: user.id, createdBy: user.id, updatedBy: user.id,
            },
        });
        const newGateOutQty = rtv.gateOutQty + dto.qty;
        const newStatus = newGateOutQty >= rtv.preparedQty - 0.0001 ? 'COMPLETED' : 'PARTIALLY_GATE_OUT';
        const updated = await this.prisma.rtvRequest.update({
            where: { id },
            data: { gateOutQty: newGateOutQty, status: newStatus, updatedBy: user.id },
        });
        await this.prisma.rejectedStockItem.update({
            where: { id: item.id },
            data: { rejectedQty: { decrement: dto.qty }, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async cancel(id, user) {
        const rtv = await this.prisma.rtvRequest.findFirst({ where: { id, companyId: user.companyId } });
        if (!rtv)
            throw new common_1.NotFoundException('RTV request not found');
        if (['COMPLETED', 'CANCELLED'].includes(rtv.status)) {
            throw new common_1.BadRequestException(`RTV request is already ${rtv.status} and cannot be cancelled`);
        }
        const newStatus = rtv.gateOutQty > 0 ? 'COMPLETED' : 'CANCELLED';
        const updated = await this.prisma.rtvRequest.update({
            where: { id }, data: { status: newStatus, updatedBy: user.id },
        });
        const stillActive = await this.prisma.rtvRequest.findFirst({
            where: { rejectedStockItemId: rtv.rejectedStockItemId, status: { notIn: ['CANCELLED'] }, id: { not: id } },
        });
        if (!stillActive) {
            await this.prisma.rejectedStockItem.updateMany({
                where: { id: rtv.rejectedStockItemId, disposition: 'RTV' },
                data: { disposition: 'PENDING', updatedBy: user.id },
            });
        }
        await this.audit.log({ tableName: 'rtv_requests', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findPending(user) {
        return this.prisma.rtvRequest.findMany({
            where: { companyId: user.companyId, status: 'DRAFT', isActive: true },
            include: { vendor: { select: { name: true } }, requestedBy: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findReadyForGateOut(user) {
        return this.prisma.rtvRequest.findMany({
            where: { companyId: user.companyId, status: { in: ['READY_FOR_GATE_OUT', 'PARTIALLY_GATE_OUT'] }, isActive: true },
            include: { vendor: { select: { name: true } }, gateOuts: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findOne(id, user) {
        const rtv = await this.prisma.rtvRequest.findFirst({
            where: { id, companyId: user.companyId },
            include: { vendor: { select: { name: true } }, requestedBy: { select: { firstName: true, lastName: true } }, gateOuts: true },
        });
        if (!rtv)
            throw new common_1.NotFoundException('RTV request not found');
        return rtv;
    }
    async findForRejectedItem(rejectedStockItemId, user) {
        return this.prisma.rtvRequest.findMany({
            where: { rejectedStockItemId, companyId: user.companyId },
            include: { gateOuts: true },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.RtvService = RtvService;
exports.RtvService = RtvService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RtvService);
//# sourceMappingURL=rtv.service.js.map