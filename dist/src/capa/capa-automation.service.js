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
exports.CapaAutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let CapaAutomationService = class CapaAutomationService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async autoCreateFromNcr(ncrId, user) {
        var _a;
        const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: ncrId, companyId: user.companyId } });
        if (!ncr)
            return { created: false, reason: 'NCR not found' };
        if (!['CRITICAL', 'MAJOR'].includes(ncr.severity))
            return { created: false, reason: 'Severity below threshold — CAPA not required' };
        const existing = await this.prisma.capaRecord.findFirst({ where: { ncrId, companyId: user.companyId } });
        if (existing)
            return { created: false, reason: 'CAPA already exists', capaId: existing.id, capaNumber: existing.capaNumber };
        const count = await this.prisma.capaRecord.count({ where: { companyId: user.companyId } });
        const year = new Date().getFullYear();
        const capaNumber = `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;
        const daysToAdd = ncr.severity === 'CRITICAL' ? 7 : 14;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        const capa = await this.prisma.capaRecord.create({
            data: {
                capaNumber, ncrId, companyId: user.companyId,
                correctiveAction: `Auto-generated from NCR ${ncr.ncrNumber}. Please update with actual corrective action.`,
                preventiveAction: `To be determined after root cause analysis of NCR ${ncr.ncrNumber}.`,
                assignedTo: user.id, dueDate,
                remarks: `Auto-created from ${ncr.severity} NCR ${ncr.ncrNumber} — ${((_a = ncr.description) === null || _a === void 0 ? void 0 : _a.substring(0, 100)) || ''}`,
                createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.prisma.ncrRecord.update({
            where: { id: ncrId },
            data: { status: 'CAPA_PENDING', updatedBy: user.id },
        });
        await this.audit.log({ tableName: 'capa_records', recordId: capa.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, capa), { source: 'AUTO' }), changedBy: user.id });
        return { created: true, capaId: capa.id, capaNumber, dueDate, message: `CAPA ${capaNumber} auto-created from NCR ${ncr.ncrNumber}` };
    }
    async checkEscalations(companyId) {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);
        const [overdue, approaching, unactioned] = await Promise.all([
            this.prisma.capaRecord.findMany({
                where: { companyId, status: { notIn: ['COMPLETED', 'VERIFIED'] }, dueDate: { lt: now } },
                include: { ncr: { select: { ncrNumber: true, severity: true } } },
                orderBy: { dueDate: 'asc' },
            }),
            this.prisma.capaRecord.findMany({
                where: { companyId, status: { notIn: ['COMPLETED', 'VERIFIED'] }, dueDate: { gte: now, lte: threeDaysFromNow } },
                include: { ncr: { select: { ncrNumber: true, severity: true } } },
                orderBy: { dueDate: 'asc' },
            }),
            this.prisma.capaRecord.findMany({
                where: { companyId, status: 'ASSIGNED', createdAt: { lt: new Date(now.getTime() - 48 * 3600000) } },
                include: { ncr: { select: { ncrNumber: true } } },
            }),
        ]);
        return {
            overdue: overdue.map(c => { var _a; return ({ id: c.id, capaNumber: c.capaNumber, dueDate: c.dueDate, assignedTo: c.assignedTo, ncrNumber: (_a = c.ncr) === null || _a === void 0 ? void 0 : _a.ncrNumber, daysOverdue: Math.floor((now.getTime() - new Date(c.dueDate).getTime()) / 86400000) }); }),
            approaching: approaching.map(c => { var _a; return ({ id: c.id, capaNumber: c.capaNumber, dueDate: c.dueDate, assignedTo: c.assignedTo, ncrNumber: (_a = c.ncr) === null || _a === void 0 ? void 0 : _a.ncrNumber, daysRemaining: Math.ceil((new Date(c.dueDate).getTime() - now.getTime()) / 86400000) }); }),
            unactioned: unactioned.map(c => { var _a; return ({ id: c.id, capaNumber: c.capaNumber, assignedTo: c.assignedTo, ncrNumber: (_a = c.ncr) === null || _a === void 0 ? void 0 : _a.ncrNumber, hoursUnactioned: Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 3600000) }); }),
            summary: { overdueCount: overdue.length, approachingCount: approaching.length, unactionedCount: unactioned.length },
        };
    }
    async checkEffectiveness(capaId, user) {
        var _a, _b, _c, _d;
        const capa = await this.prisma.capaRecord.findFirst({
            where: { id: capaId, companyId: user.companyId },
            include: { ncr: true },
        });
        if (!capa)
            return { error: 'CAPA not found' };
        if (capa.status !== 'VERIFIED')
            return { effective: null, reason: 'CAPA not yet verified' };
        const verifiedDate = capa.verifiedDate || capa.updatedAt;
        const recurringNcrs = await this.prisma.ncrRecord.findMany({
            where: {
                companyId: user.companyId,
                source: (_a = capa.ncr) === null || _a === void 0 ? void 0 : _a.source,
                itemCode: ((_b = capa.ncr) === null || _b === void 0 ? void 0 : _b.itemCode) || undefined,
                detectedDate: { gt: verifiedDate },
                id: { not: capa.ncrId },
            },
            select: { ncrNumber: true, detectedDate: true, severity: true, source: true },
        });
        const effective = recurringNcrs.length === 0;
        return {
            capaId, capaNumber: capa.capaNumber,
            ncrSource: (_c = capa.ncr) === null || _c === void 0 ? void 0 : _c.source, ncrItem: (_d = capa.ncr) === null || _d === void 0 ? void 0 : _d.itemName,
            verifiedDate, effective,
            recurringNcrs: recurringNcrs.length,
            recurringDetails: recurringNcrs,
            message: effective ? 'CAPA is effective — no recurring NCRs from same source' : `CAPA may be ineffective — ${recurringNcrs.length} recurring NCR(s) found`,
        };
    }
    async getHealthScore(companyId) {
        const now = new Date();
        const [total, completed, verified, overdue, critical] = await Promise.all([
            this.prisma.capaRecord.count({ where: { companyId } }),
            this.prisma.capaRecord.count({ where: { companyId, status: 'COMPLETED' } }),
            this.prisma.capaRecord.count({ where: { companyId, status: 'VERIFIED' } }),
            this.prisma.capaRecord.count({ where: { companyId, status: { notIn: ['COMPLETED', 'VERIFIED'] }, dueDate: { lt: now } } }),
            this.prisma.capaRecord.count({ where: { companyId, ncr: { severity: 'CRITICAL' } } }),
        ]);
        const completionRate = total > 0 ? Math.round((completed + verified) / total * 100) : 100;
        const overdueRate = total > 0 ? Math.round(overdue / total * 100) : 0;
        const healthScore = Math.max(0, completionRate - overdueRate * 2);
        return { total, completed, verified, overdue, critical, completionRate, overdueRate, healthScore, grade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D' };
    }
};
exports.CapaAutomationService = CapaAutomationService;
exports.CapaAutomationService = CapaAutomationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], CapaAutomationService);
//# sourceMappingURL=capa-automation.service.js.map