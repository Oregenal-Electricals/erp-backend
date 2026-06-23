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
exports.QuotationComparisonService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let QuotationComparisonService = class QuotationComparisonService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getMatrix(rfqId, user) {
        const rfq = await this.prisma.rfq.findFirst({
            where: { id: rfqId, companyId: user.companyId },
            include: {
                items: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
                vendors: { where: { isActive: true }, include: { vendor: { select: { id: true, code: true, name: true } } } },
            },
        });
        if (!rfq)
            throw new common_1.NotFoundException('RFQ not found');
        const quotations = await this.prisma.vendorQuotation.findMany({
            where: { rfqId, companyId: user.companyId, status: { in: ['SUBMITTED', 'FINALIZED'] } },
            include: {
                vendor: { select: { id: true, code: true, name: true } },
                items: { where: { isActive: true } },
            },
        });
        const selections = await this.prisma.quotationComparison.findMany({
            where: { rfqId, companyId: user.companyId },
        });
        const selectionMap = Object.fromEntries(selections.map(s => [s.rfqItemId, s]));
        const matrix = rfq.items.map(rfqItem => {
            var _a, _b, _c;
            const vendorPrices = quotations.map(q => {
                const qItem = q.items.find(i => i.rfqItemId === rfqItem.id);
                return {
                    quotationId: q.id,
                    quotationNumber: q.quotationNumber,
                    vendorId: q.vendorId,
                    vendorCode: q.vendor.code,
                    vendorName: q.vendor.name,
                    quotationItemId: (qItem === null || qItem === void 0 ? void 0 : qItem.id) || null,
                    quotedQty: (qItem === null || qItem === void 0 ? void 0 : qItem.quotedQty) || null,
                    unitPrice: (qItem === null || qItem === void 0 ? void 0 : qItem.unitPrice) || null,
                    discount: (qItem === null || qItem === void 0 ? void 0 : qItem.discount) || 0,
                    taxRate: (qItem === null || qItem === void 0 ? void 0 : qItem.taxRate) || 0,
                    totalPrice: (qItem === null || qItem === void 0 ? void 0 : qItem.totalPrice) || null,
                    deliveryDays: (qItem === null || qItem === void 0 ? void 0 : qItem.deliveryDays) || q.deliveryDays,
                    hasQuote: !!qItem && qItem.unitPrice > 0,
                };
            });
            const ranked = [...vendorPrices]
                .filter(v => v.hasQuote && v.totalPrice !== null)
                .sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
            const withRank = vendorPrices.map(v => (Object.assign(Object.assign({}, v), { rank: ranked.findIndex(r => r.vendorId === v.vendorId) + 1 || null })));
            return {
                rfqItemId: rfqItem.id,
                itemCode: rfqItem.itemCode,
                itemName: rfqItem.itemName,
                uom: rfqItem.uom,
                requiredQty: rfqItem.requiredQty,
                vendors: withRank,
                selectedVendorId: ((_a = selectionMap[rfqItem.id]) === null || _a === void 0 ? void 0 : _a.selectedVendorId) || null,
                selectedQuotationId: ((_b = selectionMap[rfqItem.id]) === null || _b === void 0 ? void 0 : _b.selectedQuotationId) || null,
                selectionReason: ((_c = selectionMap[rfqItem.id]) === null || _c === void 0 ? void 0 : _c.selectionReason) || null,
            };
        });
        return {
            rfq: { id: rfq.id, rfqNumber: rfq.rfqNumber, title: rfq.title, status: rfq.status },
            quotations: quotations.map(q => ({ id: q.id, quotationNumber: q.quotationNumber, vendorId: q.vendorId, vendorName: q.vendor.name, vendorCode: q.vendor.code, status: q.status, totalAmount: q.totalAmount, deliveryDays: q.deliveryDays })),
            matrix,
            totalQuotations: quotations.length,
            totalItems: rfq.items.length,
            selections: selectionMap,
        };
    }
    async selectVendors(rfqId, dto, user) {
        const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, companyId: user.companyId } });
        if (!rfq)
            throw new common_1.NotFoundException('RFQ not found');
        const results = [];
        for (const sel of dto.selections) {
            const result = await this.prisma.quotationComparison.upsert({
                where: { companyId_rfqId_rfqItemId: { companyId: user.companyId, rfqId, rfqItemId: sel.rfqItemId } },
                create: {
                    companyId: user.companyId, rfqId,
                    rfqItemId: sel.rfqItemId,
                    selectedVendorId: sel.selectedVendorId,
                    selectedQuotationId: sel.selectedQuotationId,
                    selectedItemId: sel.selectedItemId,
                    selectionReason: sel.selectionReason,
                    createdBy: user.id, updatedBy: user.id,
                },
                update: {
                    selectedVendorId: sel.selectedVendorId,
                    selectedQuotationId: sel.selectedQuotationId,
                    selectedItemId: sel.selectedItemId,
                    selectionReason: sel.selectionReason,
                    updatedBy: user.id,
                },
            });
            results.push(result);
        }
        await this.audit.log({ tableName: 'quotation_comparisons', recordId: rfqId, action: 'UPDATE', newValues: results, changedBy: user.id });
        return { message: `${results.length} selections saved`, selections: results };
    }
    async getSummary(rfqId, user) {
        const selections = await this.prisma.quotationComparison.findMany({
            where: { rfqId, companyId: user.companyId, isActive: true },
            include: {
                selectedVendor: { select: { code: true, name: true } },
                selectedQuotation: { select: { quotationNumber: true, deliveryDays: true, paymentTerms: true } },
                rfqItem: { select: { itemCode: true, itemName: true, uom: true, requiredQty: true } },
            },
        });
        const byVendor = {};
        for (const sel of selections) {
            const vendorId = sel.selectedVendorId;
            if (!byVendor[vendorId]) {
                byVendor[vendorId] = {
                    vendorId,
                    vendorCode: sel.selectedVendor.code,
                    vendorName: sel.selectedVendor.name,
                    quotationNumber: sel.selectedQuotation.quotationNumber,
                    deliveryDays: sel.selectedQuotation.deliveryDays,
                    paymentTerms: sel.selectedQuotation.paymentTerms,
                    items: [],
                };
            }
            byVendor[vendorId].items.push({
                rfqItemId: sel.rfqItemId,
                itemCode: sel.rfqItem.itemCode,
                itemName: sel.rfqItem.itemName,
                uom: sel.rfqItem.uom,
                requiredQty: sel.rfqItem.requiredQty,
                selectionReason: sel.selectionReason,
            });
        }
        return {
            rfqId,
            totalSelections: selections.length,
            vendorSummary: Object.values(byVendor),
        };
    }
    async getStats(user) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN')
            where.companyId = user.companyId;
        const total = await this.prisma.quotationComparison.count({ where });
        const rfqs = await this.prisma.quotationComparison.groupBy({ by: ['rfqId'], where });
        return { total, rfqsWithSelections: rfqs.length };
    }
};
exports.QuotationComparisonService = QuotationComparisonService;
exports.QuotationComparisonService = QuotationComparisonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], QuotationComparisonService);
//# sourceMappingURL=quotation-comparison.service.js.map