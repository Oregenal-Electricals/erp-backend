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
exports.GstService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let GstService = class GstService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    getPeriodDates(period) {
        const [year, month] = period.split('-').map(Number);
        const fromDate = new Date(year, month - 1, 1);
        const toDate = new Date(year, month, 0, 23, 59, 59);
        return { fromDate, toDate };
    }
    async getDashboard(user, period) {
        const now = new Date();
        const p = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { fromDate, toDate } = this.getPeriodDates(p);
        const arInvoices = await this.prisma.arInvoice.findMany({
            where: { companyId: user.companyId, invoiceDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } },
        });
        const apBills = await this.prisma.apBill.findMany({
            where: { companyId: user.companyId, billDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } },
        });
        const totalSales = arInvoices.reduce((s, i) => s + i.subtotal, 0);
        const totalOutputGst = arInvoices.reduce((s, i) => s + i.totalGst, 0);
        const totalOutputCgst = Math.round(totalOutputGst / 2 * 100) / 100;
        const totalOutputSgst = totalOutputGst - totalOutputCgst;
        const totalPurchases = apBills.reduce((s, b) => s + b.subtotal, 0);
        const totalInputGst = apBills.reduce((s, b) => s + b.totalGst, 0);
        const totalInputCgst = Math.round(totalInputGst / 2 * 100) / 100;
        const totalInputSgst = totalInputGst - totalInputCgst;
        const netGstLiability = Math.max(0, totalOutputGst - totalInputGst);
        const inputCredit = Math.max(0, totalInputGst - totalOutputGst);
        const monthly = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const { fromDate: mFrom, toDate: mTo } = this.getPeriodDates(mp);
            const mAr = await this.prisma.arInvoice.aggregate({ where: { companyId: user.companyId, invoiceDate: { gte: mFrom, lte: mTo }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true } });
            const mAp = await this.prisma.apBill.aggregate({ where: { companyId: user.companyId, billDate: { gte: mFrom, lte: mTo }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true } });
            monthly.push({
                period: mp,
                sales: mAr._sum.subtotal || 0, outputGst: mAr._sum.totalGst || 0,
                purchases: mAp._sum.subtotal || 0, inputGst: mAp._sum.totalGst || 0,
                netLiability: Math.max(0, (mAr._sum.totalGst || 0) - (mAp._sum.totalGst || 0)),
            });
        }
        return {
            period: p, fromDate, toDate,
            sales: { totalSales, totalOutputGst, totalOutputCgst, totalOutputSgst, invoiceCount: arInvoices.length },
            purchases: { totalPurchases, totalInputGst, totalInputCgst, totalInputSgst, billCount: apBills.length },
            netGstLiability, inputCredit, monthly,
        };
    }
    async getGstr1(user, period) {
        const { fromDate, toDate } = this.getPeriodDates(period);
        const invoices = await this.prisma.arInvoice.findMany({
            where: { companyId: user.companyId, invoiceDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } },
            include: { dispatch: { select: { dispatchNumber: true } }, salesOrder: { select: { soNumber: true } } },
            orderBy: { invoiceDate: 'asc' },
        });
        const summary = {
            totalInvoices: invoices.length,
            totalSales: invoices.reduce((s, i) => s + i.subtotal, 0),
            totalCgst: invoices.reduce((s, i) => s + i.totalGst / 2, 0),
            totalSgst: invoices.reduce((s, i) => s + i.totalGst / 2, 0),
            totalGst: invoices.reduce((s, i) => s + i.totalGst, 0),
            totalValue: invoices.reduce((s, i) => s + i.totalAmount, 0),
        };
        return { period, fromDate, toDate, summary, invoices };
    }
    async getGstr3b(user, period) {
        const { fromDate, toDate } = this.getPeriodDates(period);
        const [arData, apData] = await Promise.all([
            this.prisma.arInvoice.aggregate({ where: { companyId: user.companyId, invoiceDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true, totalAmount: true }, _count: { id: true } }),
            this.prisma.apBill.aggregate({ where: { companyId: user.companyId, billDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true, totalAmount: true }, _count: { id: true } }),
        ]);
        const outputTax = arData._sum.totalGst || 0;
        const inputTax = apData._sum.totalGst || 0;
        const netLiability = outputTax - inputTax;
        return {
            period, fromDate, toDate,
            outwardSupplies: {
                taxableValue: arData._sum.subtotal || 0,
                cgst: Math.round(outputTax / 2 * 100) / 100,
                sgst: outputTax - Math.round(outputTax / 2 * 100) / 100,
                igst: 0, totalTax: outputTax, invoiceCount: arData._count.id,
            },
            inputTaxCredit: {
                taxableValue: apData._sum.subtotal || 0,
                cgst: Math.round(inputTax / 2 * 100) / 100,
                sgst: inputTax - Math.round(inputTax / 2 * 100) / 100,
                igst: 0, totalCredit: inputTax, billCount: apData._count.id,
            },
            netTaxLiability: netLiability,
            taxPayable: Math.max(0, netLiability),
            excessCredit: Math.max(0, -netLiability),
        };
    }
    async generateReturn(dto, user) {
        const existing = await this.prisma.gstReturn.findUnique({
            where: { companyId_returnType_period: { companyId: user.companyId, returnType: dto.returnType, period: dto.period } },
        });
        if ((existing === null || existing === void 0 ? void 0 : existing.status) === 'FILED')
            throw new common_1.BadRequestException('Return already filed for this period');
        const { fromDate, toDate } = this.getPeriodDates(dto.period);
        const [arData, apData] = await Promise.all([
            this.prisma.arInvoice.aggregate({ where: { companyId: user.companyId, invoiceDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true } }),
            this.prisma.apBill.aggregate({ where: { companyId: user.companyId, billDate: { gte: fromDate, lte: toDate }, status: { notIn: ['CANCELLED'] } }, _sum: { subtotal: true, totalGst: true } }),
        ]);
        const outputGst = arData._sum.totalGst || 0;
        const inputGst = apData._sum.totalGst || 0;
        const outputCgst = Math.round(outputGst / 2 * 100) / 100;
        const inputCgst = Math.round(inputGst / 2 * 100) / 100;
        const data = {
            companyId: user.companyId, returnType: dto.returnType, period: dto.period,
            fromDate, toDate,
            totalSales: arData._sum.subtotal || 0,
            totalOutputGst: outputGst, totalOutputCgst: outputCgst, totalOutputSgst: outputGst - outputCgst, totalOutputIgst: 0,
            totalPurchases: apData._sum.subtotal || 0,
            totalInputGst: inputGst, totalInputCgst: inputCgst, totalInputSgst: inputGst - inputCgst, totalInputIgst: 0,
            netGstLiability: Math.max(0, outputGst - inputGst),
            status: 'DRAFT', remarks: dto.remarks,
            createdBy: user.id, updatedBy: user.id,
        };
        const gstReturn = existing
            ? await this.prisma.gstReturn.update({ where: { id: existing.id }, data: Object.assign(Object.assign({}, data), { updatedBy: user.id }) })
            : await this.prisma.gstReturn.create({ data });
        await this.audit.log({ tableName: 'gst_returns', recordId: gstReturn.id, action: existing ? 'UPDATE' : 'CREATE', newValues: gstReturn, changedBy: user.id });
        return gstReturn;
    }
    async fileReturn(id, dto, user) {
        const gstReturn = await this.prisma.gstReturn.findFirst({ where: { id, companyId: user.companyId } });
        if (!gstReturn)
            throw new common_1.NotFoundException('GST Return not found');
        if (gstReturn.status === 'FILED')
            throw new common_1.BadRequestException('Already filed');
        const updated = await this.prisma.gstReturn.update({
            where: { id },
            data: { status: 'FILED', filedDate: new Date(), filedBy: user.id, remarks: dto.remarks, updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'gst_returns', recordId: id, action: 'UPDATE', newValues: updated, changedBy: user.id });
        return updated;
    }
    async findAll(user) {
        return this.prisma.gstReturn.findMany({
            where: { companyId: user.companyId },
            orderBy: [{ period: 'desc' }, { returnType: 'asc' }],
        });
    }
};
exports.GstService = GstService;
exports.GstService = GstService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], GstService);
//# sourceMappingURL=gst.service.js.map