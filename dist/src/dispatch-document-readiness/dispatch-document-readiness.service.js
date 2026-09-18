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
exports.DispatchDocumentReadinessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DispatchDocumentReadinessService = class DispatchDocumentReadinessService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async checkReadiness(dispatchPlanId, user) {
        var _a, _b;
        const plan = await this.prisma.dispatchPlan.findFirst({
            where: { id: dispatchPlanId, companyId: user.companyId },
            include: { salesOrder: { select: { soNumber: true, customerName: true } } },
        });
        if (!plan)
            throw new common_1.NotFoundException('Dispatch Plan not found');
        const dispatchRecord = await this.prisma.dispatch.findFirst({
            where: { planId: dispatchPlanId, companyId: user.companyId },
            include: { arInvoices: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
        });
        const invoices = ((_a = dispatchRecord === null || dispatchRecord === void 0 ? void 0 : dispatchRecord.arInvoices) === null || _a === void 0 ? void 0 : _a.length)
            ? dispatchRecord.arInvoices
            : await this.prisma.arInvoice.findMany({ where: { soId: plan.soId, isActive: true }, orderBy: { createdAt: 'desc' } });
        const latestInvoice = invoices[0] || null;
        let invoiceStatus, invoiceReason = null;
        if (!latestInvoice) {
            invoiceStatus = 'PENDING';
            invoiceReason = 'No invoice created yet for this Sales Order';
        }
        else if (latestInvoice.status === 'CANCELLED') {
            invoiceStatus = 'BLOCKED';
            invoiceReason = 'Linked invoice was cancelled';
        }
        else if (latestInvoice.status === 'DRAFT') {
            invoiceStatus = 'PENDING';
            invoiceReason = 'Invoice exists but is still in Draft';
        }
        else {
            invoiceStatus = 'READY';
        }
        const challanStatus = 'NOT_REQUIRED';
        const challanReason = 'No Delivery Challan architecture exists in this ERP yet';
        let ewayBillStatus, ewayBillReason = null;
        if (!dispatchRecord) {
            ewayBillStatus = 'PENDING';
            ewayBillReason = 'No Dispatch record exists yet to carry an E-Way Bill number';
        }
        else if (dispatchRecord.status === 'CANCELLED') {
            ewayBillStatus = 'BLOCKED';
            ewayBillReason = 'Linked Dispatch record was cancelled';
        }
        else if (dispatchRecord.ewayBillNumber) {
            ewayBillStatus = 'READY';
        }
        else {
            ewayBillStatus = 'PENDING';
            ewayBillReason = 'Dispatch record exists but has no E-Way Bill number recorded';
        }
        const irnStatus = 'NOT_REQUIRED';
        const irnReason = 'No E-Invoice/IRN architecture exists in this ERP yet';
        const blocked = [invoiceStatus, ewayBillStatus].includes('BLOCKED');
        const allClear = [invoiceStatus, challanStatus, ewayBillStatus, irnStatus].every(s => s === 'READY' || s === 'NOT_REQUIRED');
        const overall = blocked ? 'BLOCKED' : allClear ? 'DOCUMENTS_READY' : 'DOCUMENT_PENDING';
        const result = {
            dispatchPlanId, planNumber: plan.planNumber, soNumber: (_b = plan.salesOrder) === null || _b === void 0 ? void 0 : _b.soNumber, customerName: plan.customerName,
            invoice: { status: invoiceStatus, reason: invoiceReason, invoiceNumber: (latestInvoice === null || latestInvoice === void 0 ? void 0 : latestInvoice.invoiceNumber) || null, invoiceStatusRaw: (latestInvoice === null || latestInvoice === void 0 ? void 0 : latestInvoice.status) || null },
            challan: { status: challanStatus, reason: challanReason },
            ewayBill: { status: ewayBillStatus, reason: ewayBillReason, ewayBillNumber: (dispatchRecord === null || dispatchRecord === void 0 ? void 0 : dispatchRecord.ewayBillNumber) || null },
            eInvoiceIrn: { status: irnStatus, reason: irnReason },
            overall,
            checkedBy: user.id, checkedAt: new Date().toISOString(),
        };
        await this.audit.log({
            tableName: 'dispatch_document_readiness_checks', recordId: dispatchPlanId, action: 'VIEW',
            newValues: result, changedBy: user.id,
        });
        return result;
    }
};
exports.DispatchDocumentReadinessService = DispatchDocumentReadinessService;
exports.DispatchDocumentReadinessService = DispatchDocumentReadinessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DispatchDocumentReadinessService);
//# sourceMappingURL=dispatch-document-readiness.service.js.map