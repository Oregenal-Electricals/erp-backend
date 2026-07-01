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
exports.QualityReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QualityReportsService = class QualityReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    dateWhere(fromDate, toDate) {
        if (!fromDate && !toDate)
            return undefined;
        const obj = {};
        if (fromDate)
            obj.gte = new Date(fromDate);
        if (toDate)
            obj.lte = new Date(toDate + 'T23:59:59.999Z');
        return obj;
    }
    async getNcrReport(user, query) {
        const { fromDate, toDate, status, severity, source } = query;
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        if (source)
            where.source = source;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const data = await this.prisma.ncrRecord.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { capaRecords: { select: { id: true, status: true } } },
        });
        const enriched = data.map(n => {
            const agingDays = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86400000);
            const closedDays = n.closedDate ? Math.floor((new Date(n.closedDate).getTime() - new Date(n.createdAt).getTime()) / 86400000) : null;
            return Object.assign(Object.assign({}, n), { agingDays, closedDays, totalCapas: n.capaRecords.length, verifiedCapas: n.capaRecords.filter(c => c.status === 'VERIFIED').length });
        });
        const avgClosingDays = enriched.filter(n => n.closedDays !== null).reduce((s, n) => s + n.closedDays, 0) / (enriched.filter(n => n.closedDays !== null).length || 1);
        return {
            data: enriched, total: enriched.length,
            byStatus: this.groupBy(enriched, 'status'),
            bySeverity: this.groupBy(enriched, 'severity'),
            bySource: this.groupBy(enriched, 'source'),
            avgClosingDays: Math.round(avgClosingDays),
        };
    }
    async getCapaReport(user, query) {
        const { fromDate, toDate } = query;
        const where = { companyId: user.companyId };
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const data = await this.prisma.capaRecord.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { ncr: { select: { ncrNumber: true, severity: true, source: true } } },
        });
        const now = new Date();
        const enriched = data.map(c => (Object.assign(Object.assign({}, c), { isOverdue: ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) && new Date(c.dueDate) < now, daysToComplete: c.completedDate ? Math.floor((new Date(c.completedDate).getTime() - new Date(c.createdAt).getTime()) / 86400000) : null })));
        const completed = enriched.filter(c => ['COMPLETED', 'VERIFIED'].includes(c.status));
        const overdue = enriched.filter(c => c.isOverdue);
        const avgDays = completed.filter(c => c.daysToComplete !== null).reduce((s, c) => s + c.daysToComplete, 0) / (completed.filter(c => c.daysToComplete !== null).length || 1);
        return {
            data: enriched, total: enriched.length,
            completionRate: enriched.length > 0 ? Math.round(completed.length / enriched.length * 100) : 0,
            overdueCount: overdue.length,
            avgCompletionDays: Math.round(avgDays),
            byStatus: this.groupBy(enriched, 'status'),
        };
    }
    async getOqcReport(user, query) {
        const { fromDate, toDate } = query;
        const where = { companyId: user.companyId };
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.inspectionDate = dateWhere;
        const data = await this.prisma.oqcInspection.findMany({
            where, orderBy: { inspectionDate: 'desc' },
            include: { workOrder: { select: { woNumber: true } } },
        });
        const totalSampled = data.reduce((s, d) => s + d.sampleSize, 0);
        const totalPassed = data.reduce((s, d) => s + d.passQty, 0);
        const totalFailed = data.reduce((s, d) => s + d.failQty, 0);
        const byItem = {};
        data.forEach(d => {
            if (!byItem[d.itemCode])
                byItem[d.itemCode] = { itemCode: d.itemCode, itemName: d.itemName, inspections: 0, sampled: 0, passed: 0, failed: 0 };
            byItem[d.itemCode].inspections++;
            byItem[d.itemCode].sampled += d.sampleSize;
            byItem[d.itemCode].passed += d.passQty;
            byItem[d.itemCode].failed += d.failQty;
        });
        return {
            data, total: data.length,
            totalSampled, totalPassed, totalFailed,
            overallPassRate: totalSampled > 0 ? Math.round(totalPassed / totalSampled * 100) : 0,
            byResult: this.groupBy(data, 'result'),
            byItem: Object.values(byItem).map((i) => (Object.assign(Object.assign({}, i), { passRate: i.sampled > 0 ? Math.round(i.passed / i.sampled * 100) : 0 }))),
        };
    }
    async getSupplierReport(user, query) {
        const { period } = query;
        const where = { companyId: user.companyId };
        if (period)
            where.period = period;
        const ratings = await this.prisma.supplierQualityRating.findMany({
            where, orderBy: [{ qualityScore: 'asc' }],
            include: { vendor: { select: { name: true, code: true } } },
        });
        const cars = await this.prisma.supplierCar.findMany({
            where: { companyId: user.companyId }, orderBy: { createdAt: 'desc' },
            include: { vendor: { select: { name: true, code: true } } },
        });
        return {
            ratings, totalRatings: ratings.length,
            blacklisted: ratings.filter(r => r.avlStatus === 'BLACKLISTED').length,
            probation: ratings.filter(r => r.avlStatus === 'PROBATION').length,
            avgScore: ratings.length > 0 ? Math.round(ratings.reduce((s, r) => s + r.qualityScore, 0) / ratings.length) : 0,
            cars, totalCars: cars.length,
            openCars: cars.filter(c => !['CLOSED'].includes(c.status)).length,
        };
    }
    async getComplaintReport(user, query) {
        const { fromDate, toDate, status } = query;
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.complaintDate = dateWhere;
        const data = await this.prisma.customerComplaint.findMany({ where, orderBy: { complaintDate: 'desc' } });
        const enriched = data.map(c => (Object.assign(Object.assign({}, c), { responseDays: c.responseDate ? Math.floor((new Date(c.responseDate).getTime() - new Date(c.receivedDate).getTime()) / 86400000) : null })));
        const responded = enriched.filter(c => c.responseDays !== null);
        const avgResponseDays = responded.length > 0 ? Math.round(responded.reduce((s, c) => s + c.responseDays, 0) / responded.length) : 0;
        return {
            data: enriched, total: enriched.length,
            byType: this.groupBy(enriched, 'complaintType'),
            bySeverity: this.groupBy(enriched, 'severity'),
            byStatus: this.groupBy(enriched, 'status'),
            avgResponseDays,
            closureRate: enriched.length > 0 ? Math.round(enriched.filter(c => c.status === 'CLOSED').length / enriched.length * 100) : 0,
        };
    }
    async getKpiSummary(user) {
        const cid = user.companyId;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [ncrTotal, ncrOpen, ncrClosed, capaTotal, capaVerified, capaOverdue, oqcData, ccTotal, ccClosed, sqRatings,] = await Promise.all([
            this.prisma.ncrRecord.count({ where: { companyId: cid } }),
            this.prisma.ncrRecord.count({ where: { companyId: cid, status: { not: 'CLOSED' } } }),
            this.prisma.ncrRecord.count({ where: { companyId: cid, status: 'CLOSED' } }),
            this.prisma.capaRecord.count({ where: { companyId: cid } }),
            this.prisma.capaRecord.count({ where: { companyId: cid, status: 'VERIFIED' } }),
            this.prisma.capaRecord.count({ where: { companyId: cid, status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: now } } }),
            this.prisma.oqcInspection.aggregate({ where: { companyId: cid }, _sum: { sampleSize: true, passQty: true } }),
            this.prisma.customerComplaint.count({ where: { companyId: cid } }),
            this.prisma.customerComplaint.count({ where: { companyId: cid, status: 'CLOSED' } }),
            this.prisma.supplierQualityRating.findMany({ where: { companyId: cid }, select: { qualityScore: true, avlStatus: true } }),
        ]);
        const oqcPassRate = oqcData._sum.sampleSize > 0 ? Math.round(oqcData._sum.passQty / oqcData._sum.sampleSize * 100) : 0;
        const avgSupplierScore = sqRatings.length > 0 ? Math.round(sqRatings.reduce((s, r) => s + r.qualityScore, 0) / sqRatings.length) : 0;
        return {
            generatedAt: now,
            ncr: { total: ncrTotal, open: ncrOpen, closed: ncrClosed, closureRate: ncrTotal > 0 ? Math.round(ncrClosed / ncrTotal * 100) : 0 },
            capa: { total: capaTotal, verified: capaVerified, overdue: capaOverdue, effectivenessRate: capaTotal > 0 ? Math.round(capaVerified / capaTotal * 100) : 0 },
            oqc: { passRate: oqcPassRate, totalSampled: oqcData._sum.sampleSize || 0 },
            complaints: { total: ccTotal, closed: ccClosed, closureRate: ccTotal > 0 ? Math.round(ccClosed / ccTotal * 100) : 0 },
            supplier: { totalRated: sqRatings.length, avgScore: avgSupplierScore, blacklisted: sqRatings.filter(r => r.avlStatus === 'BLACKLISTED').length },
        };
    }
    groupBy(arr, key) {
        const groups = {};
        arr.forEach(item => { groups[item[key]] = (groups[item[key]] || 0) + 1; });
        return Object.entries(groups).map(([k, v]) => ({ label: k, count: v }));
    }
};
exports.QualityReportsService = QualityReportsService;
exports.QualityReportsService = QualityReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QualityReportsService);
//# sourceMappingURL=quality-reports.service.js.map