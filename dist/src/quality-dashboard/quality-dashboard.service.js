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
exports.QualityDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QualityDashboardService = class QualityDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(user) {
        const cid = user.companyId;
        const [ncrTotal, ncrOpen, ncrCritical, ncrClosed, capaTotal, capaOverdue, capaVerified, capaInProgress, rcaDraft, oqcTotal, oqcPass, oqcFail, oqcReleased, ccTotal, ccOpen, ccCritical, sqBlacklisted, sqProbation, carOpen,] = await Promise.all([
            this.prisma.ncrRecord.count({ where: { companyId: cid } }),
            this.prisma.ncrRecord.count({ where: { companyId: cid, status: { not: 'CLOSED' } } }),
            this.prisma.ncrRecord.count({ where: { companyId: cid, severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
            this.prisma.ncrRecord.count({ where: { companyId: cid, status: 'CLOSED' } }),
            this.prisma.capaRecord.count({ where: { companyId: cid } }),
            this.prisma.capaRecord.count({ where: { companyId: cid, status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } } }),
            this.prisma.capaRecord.count({ where: { companyId: cid, status: 'VERIFIED' } }),
            this.prisma.capaRecord.count({ where: { companyId: cid, status: 'IN_PROGRESS' } }),
            this.prisma.rcaRecord.count({ where: { companyId: cid, status: 'DRAFT' } }),
            this.prisma.oqcInspection.count({ where: { companyId: cid } }),
            this.prisma.oqcInspection.count({ where: { companyId: cid, result: 'PASS' } }),
            this.prisma.oqcInspection.count({ where: { companyId: cid, result: 'FAIL' } }),
            this.prisma.oqcInspection.count({ where: { companyId: cid, status: 'RELEASED' } }),
            this.prisma.customerComplaint.count({ where: { companyId: cid } }),
            this.prisma.customerComplaint.count({ where: { companyId: cid, status: { not: 'CLOSED' } } }),
            this.prisma.customerComplaint.count({ where: { companyId: cid, severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
            this.prisma.supplierQualityRating.count({ where: { companyId: cid, avlStatus: 'BLACKLISTED' } }),
            this.prisma.supplierQualityRating.count({ where: { companyId: cid, avlStatus: 'PROBATION' } }),
            this.prisma.supplierCar.count({ where: { companyId: cid, status: { in: ['SENT', 'RESPONDED'] } } }),
        ]);
        const oqcPassRate = oqcTotal > 0 ? Math.round(oqcPass / oqcTotal * 100) : 0;
        return {
            ncr: { total: ncrTotal, open: ncrOpen, critical: ncrCritical, closed: ncrClosed },
            capa: { total: capaTotal, overdue: capaOverdue, inProgress: capaInProgress, verified: capaVerified },
            rca: { draft: rcaDraft },
            oqc: { total: oqcTotal, pass: oqcPass, fail: oqcFail, released: oqcReleased, passRate: oqcPassRate },
            complaints: { total: ccTotal, open: ccOpen, critical: ccCritical },
            supplier: { blacklisted: sqBlacklisted, probation: sqProbation, openCars: carOpen },
        };
    }
    async getNcrSummary(user) {
        const cid = user.companyId;
        const [bySource, bySeverity, byStatus] = await Promise.all([
            this.prisma.ncrRecord.groupBy({ by: ['source'], where: { companyId: cid }, _count: { id: true } }),
            this.prisma.ncrRecord.groupBy({ by: ['severity'], where: { companyId: cid }, _count: { id: true } }),
            this.prisma.ncrRecord.groupBy({ by: ['status'], where: { companyId: cid }, _count: { id: true } }),
        ]);
        const recent = await this.prisma.ncrRecord.findMany({
            where: { companyId: cid, status: { not: 'CLOSED' } },
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { ncrNumber: true, description: true, severity: true, source: true, status: true, createdAt: true },
        });
        return {
            bySource: bySource.map(s => ({ source: s.source, count: s._count.id })),
            bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.id })),
            byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
            recent,
        };
    }
    async getOqcTrend(user) {
        const cid = user.companyId;
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const label = `${year}-${String(month).padStart(2, '0')}`;
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            const [total, pass] = await Promise.all([
                this.prisma.oqcInspection.count({ where: { companyId: cid, inspectionDate: { gte: start, lte: end } } }),
                this.prisma.oqcInspection.count({ where: { companyId: cid, result: 'PASS', inspectionDate: { gte: start, lte: end } } }),
            ]);
            months.push({ label, total, pass, passRate: total > 0 ? Math.round(pass / total * 100) : 0 });
        }
        return { trend: months };
    }
    async getAlerts(user) {
        const cid = user.companyId;
        const alerts = [];
        const overdueCapa = await this.prisma.capaRecord.findMany({
            where: { companyId: cid, status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
            select: { capaNumber: true, assignedTo: true, dueDate: true, ncr: { select: { ncrNumber: true } } },
            take: 10,
        });
        overdueCapa.forEach(c => { var _a; return alerts.push({ type: 'OVERDUE_CAPA', level: 'HIGH', message: `CAPA ${c.capaNumber} overdue (NCR: ${(_a = c.ncr) === null || _a === void 0 ? void 0 : _a.ncrNumber})`, reference: c.capaNumber, dueDate: c.dueDate }); });
        const criticalNcr = await this.prisma.ncrRecord.findMany({
            where: { companyId: cid, severity: 'CRITICAL', status: { not: 'CLOSED' } },
            select: { ncrNumber: true, description: true, source: true, createdAt: true },
            take: 5,
        });
        criticalNcr.forEach(n => alerts.push({ type: 'CRITICAL_NCR', level: 'CRITICAL', message: `Critical NCR ${n.ncrNumber} open (${n.source})`, reference: n.ncrNumber }));
        const criticalComplaints = await this.prisma.customerComplaint.findMany({
            where: { companyId: cid, severity: 'CRITICAL', status: { not: 'CLOSED' } },
            select: { complaintNumber: true, customerName: true, complaintDate: true },
            take: 5,
        });
        criticalComplaints.forEach(c => alerts.push({ type: 'CRITICAL_COMPLAINT', level: 'CRITICAL', message: `Critical complaint ${c.complaintNumber} from ${c.customerName}`, reference: c.complaintNumber }));
        const draftRca = await this.prisma.rcaRecord.findMany({
            where: { companyId: cid, status: 'DRAFT' },
            select: { rcaNumber: true, ncr: { select: { ncrNumber: true } } },
            take: 5,
        });
        draftRca.forEach(r => { var _a; return alerts.push({ type: 'PENDING_RCA', level: 'MEDIUM', message: `RCA ${r.rcaNumber} pending completion (NCR: ${(_a = r.ncr) === null || _a === void 0 ? void 0 : _a.ncrNumber})`, reference: r.rcaNumber }); });
        const overdueCar = await this.prisma.supplierCar.findMany({
            where: { companyId: cid, status: { in: ['SENT', 'RESPONDED'] }, dueDate: { lt: new Date() } },
            select: { carNumber: true, vendor: { select: { name: true } }, dueDate: true },
            take: 5,
        });
        overdueCar.forEach(c => { var _a; return alerts.push({ type: 'OVERDUE_CAR', level: 'HIGH', message: `CAR ${c.carNumber} overdue — ${(_a = c.vendor) === null || _a === void 0 ? void 0 : _a.name}`, reference: c.carNumber, dueDate: c.dueDate }); });
        const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
        alerts.sort((a, b) => priority[a.level] - priority[b.level]);
        return { alerts, total: alerts.length };
    }
};
exports.QualityDashboardService = QualityDashboardService;
exports.QualityDashboardService = QualityDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QualityDashboardService);
//# sourceMappingURL=quality-dashboard.service.js.map