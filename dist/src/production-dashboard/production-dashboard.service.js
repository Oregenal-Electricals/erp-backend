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
exports.ProductionDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductionDashboardService = class ProductionDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(user) {
        const companyId = user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [totalWos, draftWos, releasedWos, inProgressWos, completedWos, cancelledWos, todayEntries, totalFgReceipts, pendingFgr, qcStats, costStats,] = await Promise.all([
            this.prisma.workOrder.count({ where: { companyId } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'DRAFT' } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'RELEASED' } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'IN_PROGRESS' } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED' } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'CANCELLED' } }),
            this.prisma.productionEntry.findMany({
                where: { companyId, status: 'CONFIRMED', entryDate: { gte: today, lt: tomorrow } },
            }),
            this.prisma.fgReceipt.count({ where: { companyId, status: 'RECEIVED' } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED', fgReceipts: { none: { status: 'RECEIVED' } } } }),
            this.prisma.productionQc.aggregate({ where: { companyId }, _sum: { sampleSize: true, passQty: true }, _count: { id: true } }),
            this.prisma.productionCostSheet.aggregate({ where: { companyId }, _sum: { totalCost: true, materialCost: true } }),
        ]);
        const todayGoodQty = todayEntries.reduce((s, e) => s + e.goodQty, 0);
        const todayScrapQty = todayEntries.reduce((s, e) => s + e.scrapQty, 0);
        const overallPassRate = qcStats._sum.sampleSize > 0
            ? Math.round(qcStats._sum.passQty / qcStats._sum.sampleSize * 100) : 0;
        return {
            workOrders: { total: totalWos, draft: draftWos, released: releasedWos, inProgress: inProgressWos, completed: completedWos, cancelled: cancelledWos },
            today: { goodQty: todayGoodQty, scrapQty: todayScrapQty, totalQty: todayGoodQty + todayScrapQty, entries: todayEntries.length },
            fgReceipts: { total: totalFgReceipts, pendingFgr },
            quality: { totalInspections: qcStats._count.id, overallPassRate },
            costs: { totalProductionCost: costStats._sum.totalCost || 0, totalMaterialCost: costStats._sum.materialCost || 0 },
        };
    }
    async getActiveWos(user) {
        const companyId = user.companyId;
        const wos = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] } },
            include: {
                warehouse: { select: { name: true } },
                productionIssues: { where: { status: 'ISSUED' }, select: { id: true } },
            },
            orderBy: [{ priority: 'desc' }, { plannedEndDate: 'asc' }],
            take: 10,
        });
        return wos.map(wo => {
            var _a;
            const progressPct = wo.plannedQty > 0 ? Math.round(wo.completedQty / wo.plannedQty * 100) : 0;
            const isOverdue = wo.plannedEndDate < new Date() && wo.status !== 'COMPLETED';
            const daysLeft = Math.ceil((wo.plannedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return {
                id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode,
                productName: wo.productName, status: wo.status, priority: wo.priority,
                plannedQty: wo.plannedQty, completedQty: wo.completedQty,
                progressPct, isOverdue, daysLeft,
                warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                materialIssued: wo.productionIssues.length > 0,
                plannedEndDate: wo.plannedEndDate,
            };
        });
    }
    async getToday(user) {
        const companyId = user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const entries = await this.prisma.productionEntry.findMany({
            where: { companyId, entryDate: { gte: today, lt: tomorrow } },
            include: { workOrder: { select: { woNumber: true, productName: true } } },
            orderBy: { entryDate: 'desc' },
        });
        const byShift = {
            MORNING: entries.filter(e => e.shift === 'MORNING'),
            EVENING: entries.filter(e => e.shift === 'EVENING'),
            NIGHT: entries.filter(e => e.shift === 'NIGHT'),
        };
        return {
            entries,
            byShift: Object.entries(byShift).map(([shift, list]) => ({
                shift,
                entries: list.length,
                goodQty: list.reduce((s, e) => s + e.goodQty, 0),
                scrapQty: list.reduce((s, e) => s + e.scrapQty, 0),
            })),
            totalGoodQty: entries.reduce((s, e) => s + e.goodQty, 0),
            totalScrapQty: entries.reduce((s, e) => s + e.scrapQty, 0),
        };
    }
    async getAlerts(user) {
        const companyId = user.companyId;
        const overdueWos = await this.prisma.workOrder.findMany({
            where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] }, plannedEndDate: { lt: new Date() } },
            select: { woNumber: true, productName: true, plannedEndDate: true, status: true },
        });
        const releasedNoIssue = await this.prisma.workOrder.findMany({
            where: { companyId, status: 'RELEASED', productionIssues: { none: {} } },
            select: { woNumber: true, productName: true, plannedStartDate: true },
        });
        const failedQc = await this.prisma.productionQc.findMany({
            where: { companyId, result: 'FAIL' },
            include: { workOrder: { select: { woNumber: true, productName: true } } },
            orderBy: { inspectionDate: 'desc' },
            take: 5,
        });
        const pendingFgr = await this.prisma.workOrder.findMany({
            where: { companyId, status: 'COMPLETED', fgReceipts: { none: { status: 'RECEIVED' } } },
            select: { woNumber: true, productName: true, completedQty: true },
        });
        return {
            overdueWos, releasedNoIssue, failedQc, pendingFgr,
            totalAlerts: overdueWos.length + releasedNoIssue.length + failedQc.length + pendingFgr.length,
        };
    }
    async getQualityMetrics(user) {
        const companyId = user.companyId;
        const inspections = await this.prisma.productionQc.findMany({
            where: { companyId, status: 'COMPLETED' },
            include: { workOrder: { select: { woNumber: true, productName: true } } },
            orderBy: { inspectionDate: 'desc' },
            take: 20,
        });
        const byResult = {
            PASS: inspections.filter(i => i.result === 'PASS').length,
            FAIL: inspections.filter(i => i.result === 'FAIL').length,
            CONDITIONAL: inspections.filter(i => i.result === 'CONDITIONAL').length,
        };
        const totalSampled = inspections.reduce((s, i) => s + i.sampleSize, 0);
        const totalPassed = inspections.reduce((s, i) => s + i.passQty, 0);
        const overallPassRate = totalSampled > 0 ? Math.round(totalPassed / totalSampled * 100) : 0;
        return { inspections, byResult, totalSampled, totalPassed, overallPassRate };
    }
    async getHourlyMonitoring(user, dateStr) {
        const companyId = user.companyId;
        const HOURS_PER_MONTH = 208;
        const day = dateStr ? new Date(dateStr) : new Date();
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        const [activeWos, startedToday, completedToday, entries, manpowerToday, transfersToday] = await Promise.all([
            this.prisma.workOrder.findMany({
                where: { companyId, status: { in: ['RELEASED', 'IN_PROGRESS'] } },
                select: {
                    id: true, woNumber: true, productCode: true, productName: true,
                    stageName: true, status: true, plannedQty: true, completedQty: true,
                    plannedStartDate: true, plannedEndDate: true, actualStartDate: true,
                },
            }),
            this.prisma.workOrder.count({ where: { companyId, actualStartDate: { gte: day, lt: nextDay } } }),
            this.prisma.workOrder.count({ where: { companyId, status: 'COMPLETED', actualEndDate: { gte: day, lt: nextDay } } }),
            this.prisma.productionEntry.findMany({
                where: { companyId, status: 'CONFIRMED', entryDate: { gte: day, lt: nextDay } },
                include: { workOrder: { select: { woNumber: true, productName: true, stageName: true } } },
            }),
            this.prisma.manpowerAllocation.findMany({
                where: { companyId, level: 'STAGE_TO_LINE', date: { gte: day, lt: nextDay }, status: { in: ['PENDING', 'ACCEPTED'] } },
            }),
            this.prisma.stageTransferNote.findMany({
                where: { companyId, givenAt: { gte: day, lt: nextDay } },
                include: {
                    fromWorkOrder: { select: { woNumber: true, stageName: true } },
                    toWorkOrder: { select: { woNumber: true, stageName: true } },
                },
                orderBy: { givenAt: 'desc' },
            }),
        ]);
        const hourlyBuckets = new Map();
        for (let h = 0; h < 24; h++)
            hourlyBuckets.set(h, { goodQty: 0, scrapQty: 0, entries: 0 });
        for (const e of entries) {
            const hour = e.entryDate.getHours();
            const bucket = hourlyBuckets.get(hour);
            bucket.goodQty += e.goodQty;
            bucket.scrapQty += e.scrapQty;
            bucket.entries += 1;
        }
        const hourlyOutput = Array.from(hourlyBuckets.entries())
            .map(([hour, v]) => (Object.assign({ hour: `${String(hour).padStart(2, '0')}:00` }, v)))
            .filter(b => b.entries > 0 || (b.hour >= '06:00' && b.hour <= '22:00'));
        const stageMap = new Map();
        for (const e of entries) {
            const stage = e.workOrder.stageName || 'NO_ROUTING';
            if (!stageMap.has(stage))
                stageMap.set(stage, { goodQty: 0, scrapQty: 0, woNumbers: new Set() });
            const s = stageMap.get(stage);
            s.goodQty += e.goodQty;
            s.scrapQty += e.scrapQty;
            s.woNumbers.add(e.workOrder.woNumber);
        }
        const stageWiseOutput = Array.from(stageMap.entries()).map(([stageName, v]) => ({
            stageName, goodQty: v.goodQty, scrapQty: v.scrapQty, workOrderCount: v.woNumbers.size,
        }));
        const manpowerByWo = new Map();
        let unassignedHeadcount = 0;
        for (const m of manpowerToday) {
            if (m.workOrderId)
                manpowerByWo.set(m.workOrderId, (manpowerByWo.get(m.workOrderId) || 0) + m.count);
            else
                unassignedHeadcount += m.count;
        }
        const activeWoIds = new Set(activeWos.map(w => w.id));
        const idleHeadcount = manpowerToday
            .filter(m => m.workOrderId && !activeWoIds.has(m.workOrderId))
            .reduce((s, m) => s + m.count, 0) + unassignedHeadcount;
        const totalAllocatedToday = manpowerToday.reduce((s, m) => s + m.count, 0);
        const now = Date.now();
        const woDetails = activeWos.map(wo => {
            const progressPct = wo.plannedQty > 0 ? Math.round(wo.completedQty / wo.plannedQty * 100) : 0;
            const allocatedManpower = manpowerByWo.get(wo.id) || 0;
            let efficiencyPct = null;
            if (wo.actualStartDate && wo.plannedStartDate && wo.plannedEndDate) {
                const plannedHours = (wo.plannedEndDate.getTime() - wo.plannedStartDate.getTime()) / (1000 * 60 * 60);
                const elapsedHours = (now - wo.actualStartDate.getTime()) / (1000 * 60 * 60);
                if (plannedHours > 0 && elapsedHours > 0) {
                    const plannedRatePerHour = wo.plannedQty / plannedHours;
                    const actualRatePerHour = wo.completedQty / elapsedHours;
                    efficiencyPct = plannedRatePerHour > 0 ? Math.round(actualRatePerHour / plannedRatePerHour * 100) : null;
                }
            }
            return {
                id: wo.id, woNumber: wo.woNumber, productCode: wo.productCode, productName: wo.productName,
                stageName: wo.stageName, status: wo.status, plannedQty: wo.plannedQty, completedQty: wo.completedQty,
                progressPct, allocatedManpower, efficiencyPct,
            };
        });
        const employees = await this.prisma.employee.findMany({
            where: { companyId, userId: { in: manpowerToday.filter(m => m.toUserId).map(m => m.toUserId) } },
            select: { userId: true, basicSalary: true, hraAmount: true, conveyanceAmount: true, otherAllowances: true },
        });
        const hourlyRateByUserId = new Map();
        for (const emp of employees) {
            const grossMonthly = emp.basicSalary + emp.hraAmount + emp.conveyanceAmount + emp.otherAllowances;
            hourlyRateByUserId.set(emp.userId, grossMonthly / HOURS_PER_MONTH);
        }
        let totalManpowerCostToday = 0;
        let headcountWithoutRate = 0;
        const costByStage = new Map();
        for (const m of manpowerToday) {
            const stage = m.category || 'UNSPECIFIED';
            if (!costByStage.has(stage))
                costByStage.set(stage, { headcount: 0, estimatedCost: 0 });
            const bucket = costByStage.get(stage);
            bucket.headcount += m.count;
            const rate = m.toUserId ? hourlyRateByUserId.get(m.toUserId) : undefined;
            if (rate) {
                const cost = rate * m.count * 8;
                bucket.estimatedCost += cost;
                totalManpowerCostToday += cost;
            }
            else {
                headcountWithoutRate += m.count;
            }
        }
        return {
            date: day.toISOString().slice(0, 10),
            workOrders: {
                active: woDetails,
                activeCount: activeWos.length,
                startedToday, completedToday,
            },
            hourlyOutput,
            stageWiseOutput,
            manpower: {
                totalAllocatedToday, idleHeadcount,
                utilizationPct: totalAllocatedToday > 0 ? Math.round((totalAllocatedToday - idleHeadcount) / totalAllocatedToday * 100) : 0,
            },
            transfers: {
                todayCount: transfersToday.length,
                list: transfersToday.map(t => ({
                    id: t.id, itemCode: t.itemCode, itemName: t.itemName, qty: t.qty, status: t.status,
                    fromWoNumber: t.fromWorkOrder.woNumber, fromStage: t.fromWorkOrder.stageName,
                    toWoNumber: t.toWorkOrder.woNumber, toStage: t.toWorkOrder.stageName,
                    givenAt: t.givenAt, receivedAt: t.receivedAt,
                })),
            },
            efficiency: {
                overallGoodVsTotalPct: (() => {
                    const totalGood = entries.reduce((s, e) => s + e.goodQty, 0);
                    const totalScrap = entries.reduce((s, e) => s + e.scrapQty, 0);
                    const total = totalGood + totalScrap;
                    return total > 0 ? Math.round(totalGood / total * 100) : 0;
                })(),
            },
            costing: {
                assumptionNote: `Hourly rate estimated as (basicSalary + hraAmount + conveyanceAmount + otherAllowances) / ${HOURS_PER_MONTH} standard monthly hours (26 days x 8 hours). Adjust HOURS_PER_MONTH in production-dashboard.service.ts if your actual working-hours convention differs.`,
                totalManpowerCostToday: Math.round(totalManpowerCostToday * 100) / 100,
                headcountWithoutRate,
                perStage: Array.from(costByStage.entries()).map(([stageName, v]) => ({
                    stageName, headcount: v.headcount, estimatedCost: Math.round(v.estimatedCost * 100) / 100,
                })),
            },
        };
    }
};
exports.ProductionDashboardService = ProductionDashboardService;
exports.ProductionDashboardService = ProductionDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductionDashboardService);
//# sourceMappingURL=production-dashboard.service.js.map