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
exports.ProductionReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductionReportsService = class ProductionReportsService {
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
    async getWoCompletionReport(user, query) {
        const { fromDate, toDate, status } = query;
        const where = { companyId: user.companyId };
        if (status)
            where.status = status;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.createdAt = dateWhere;
        const wos = await this.prisma.workOrder.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { warehouse: { select: { name: true } }, costSheet: { select: { totalCost: true, unitCost: true } } },
        });
        const data = wos.map(wo => {
            var _a, _b, _c;
            return ({
                woNumber: wo.woNumber, productCode: wo.productCode, productName: wo.productName,
                status: wo.status, priority: wo.priority, warehouse: (_a = wo.warehouse) === null || _a === void 0 ? void 0 : _a.name,
                plannedQty: wo.plannedQty, completedQty: wo.completedQty, rejectedQty: wo.rejectedQty,
                achievementPct: wo.plannedQty > 0 ? Math.round(wo.completedQty / wo.plannedQty * 100) : 0,
                plannedStartDate: wo.plannedStartDate, plannedEndDate: wo.plannedEndDate,
                actualStartDate: wo.actualStartDate, actualEndDate: wo.actualEndDate,
                totalCost: ((_b = wo.costSheet) === null || _b === void 0 ? void 0 : _b.totalCost) || 0, unitCost: ((_c = wo.costSheet) === null || _c === void 0 ? void 0 : _c.unitCost) || 0,
            });
        });
        return {
            data, totalWos: data.length,
            avgAchievement: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.achievementPct, 0) / data.length) : 0,
            totalPlanned: data.reduce((s, d) => s + d.plannedQty, 0),
            totalCompleted: data.reduce((s, d) => s + d.completedQty, 0),
        };
    }
    async getShiftProductionReport(user, query) {
        const { fromDate, toDate, shift } = query;
        const where = { companyId: user.companyId, status: 'CONFIRMED' };
        if (shift)
            where.shift = shift;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.entryDate = dateWhere;
        const entries = await this.prisma.productionEntry.findMany({
            where, orderBy: { entryDate: 'desc' },
            include: { workOrder: { select: { woNumber: true, productName: true } } },
        });
        const byShift = {};
        for (const e of entries) {
            if (!byShift[e.shift])
                byShift[e.shift] = { shift: e.shift, entries: 0, goodQty: 0, scrapQty: 0 };
            byShift[e.shift].entries++;
            byShift[e.shift].goodQty += e.goodQty;
            byShift[e.shift].scrapQty += e.scrapQty;
        }
        const byOperator = {};
        for (const e of entries) {
            const key = e.operatorName || 'Unassigned';
            if (!byOperator[key])
                byOperator[key] = { operator: key, entries: 0, goodQty: 0, scrapQty: 0 };
            byOperator[key].entries++;
            byOperator[key].goodQty += e.goodQty;
            byOperator[key].scrapQty += e.scrapQty;
        }
        return {
            data: entries, totalEntries: entries.length,
            byShift: Object.values(byShift), byOperator: Object.values(byOperator),
            totalGoodQty: entries.reduce((s, e) => s + e.goodQty, 0),
            totalScrapQty: entries.reduce((s, e) => s + e.scrapQty, 0),
        };
    }
    async getMaterialConsumptionReport(user, query) {
        const { workOrderId } = query;
        const where = { companyId: user.companyId, status: 'ISSUED' };
        if (workOrderId)
            where.workOrderId = workOrderId;
        const issues = await this.prisma.productionIssue.findMany({
            where, include: {
                workOrder: { select: { woNumber: true, productName: true, plannedQty: true, bomId: true } },
                items: true,
            },
        });
        const consumption = {};
        for (const issue of issues) {
            for (const item of issue.items) {
                const key = item.itemCode;
                if (!consumption[key]) {
                    consumption[key] = { itemCode: item.itemCode, itemName: item.itemName, uom: item.uom, totalIssued: 0, totalValue: 0, woCount: 0 };
                }
                consumption[key].totalIssued += item.issuedQty;
                consumption[key].totalValue += item.issuedQty * item.unitCost;
                consumption[key].woCount++;
            }
        }
        const data = Object.values(consumption).sort((a, b) => b.totalValue - a.totalValue);
        return { data, totalItems: data.length, totalValue: data.reduce((s, d) => s + d.totalValue, 0) };
    }
    async getScrapAnalysis(user, query) {
        const { fromDate, toDate } = query;
        const where = { companyId: user.companyId, status: 'CONFIRMED', scrapQty: { gt: 0 } };
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.entryDate = dateWhere;
        const entries = await this.prisma.productionEntry.findMany({
            where, orderBy: { scrapQty: 'desc' },
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
        });
        const byProduct = {};
        for (const e of entries) {
            const key = e.workOrder.productCode;
            if (!byProduct[key])
                byProduct[key] = { productCode: key, productName: e.workOrder.productName, totalScrap: 0, totalGood: 0, entries: 0 };
            byProduct[key].totalScrap += e.scrapQty;
            byProduct[key].totalGood += e.goodQty;
            byProduct[key].entries++;
        }
        const byProductArr = Object.values(byProduct).map((p) => (Object.assign(Object.assign({}, p), { scrapRate: (p.totalGood + p.totalScrap) > 0 ? Math.round(p.totalScrap / (p.totalGood + p.totalScrap) * 100 * 10) / 10 : 0 })));
        const totalScrap = entries.reduce((s, e) => s + e.scrapQty, 0);
        const totalGood = entries.reduce((s, e) => s + e.goodQty, 0);
        return {
            data: entries, byProduct: byProductArr,
            totalScrap, totalGood,
            overallScrapRate: (totalGood + totalScrap) > 0 ? Math.round(totalScrap / (totalGood + totalScrap) * 100 * 10) / 10 : 0,
        };
    }
    async getQualitySummary(user, query) {
        const { fromDate, toDate, stage } = query;
        const where = { companyId: user.companyId, status: 'COMPLETED' };
        if (stage)
            where.inspectionStage = stage;
        const dateWhere = this.dateWhere(fromDate, toDate);
        if (dateWhere)
            where.inspectionDate = dateWhere;
        const inspections = await this.prisma.productionQc.findMany({
            where, orderBy: { inspectionDate: 'desc' },
            include: { workOrder: { select: { woNumber: true, productCode: true, productName: true } } },
        });
        const byStage = {};
        for (const i of inspections) {
            if (!byStage[i.inspectionStage])
                byStage[i.inspectionStage] = { stage: i.inspectionStage, total: 0, pass: 0, fail: 0, conditional: 0, sampleSize: 0, passQty: 0 };
            byStage[i.inspectionStage].total++;
            byStage[i.inspectionStage].sampleSize += i.sampleSize;
            byStage[i.inspectionStage].passQty += i.passQty;
            if (i.result === 'PASS')
                byStage[i.inspectionStage].pass++;
            else if (i.result === 'FAIL')
                byStage[i.inspectionStage].fail++;
            else if (i.result === 'CONDITIONAL')
                byStage[i.inspectionStage].conditional++;
        }
        const byStageArr = Object.values(byStage).map((s) => (Object.assign(Object.assign({}, s), { passRate: s.sampleSize > 0 ? Math.round(s.passQty / s.sampleSize * 100) : 0 })));
        const totalSampled = inspections.reduce((s, i) => s + i.sampleSize, 0);
        const totalPassed = inspections.reduce((s, i) => s + i.passQty, 0);
        return {
            data: inspections, byStage: byStageArr, totalInspections: inspections.length,
            overallPassRate: totalSampled > 0 ? Math.round(totalPassed / totalSampled * 100) : 0,
        };
    }
};
exports.ProductionReportsService = ProductionReportsService;
exports.ProductionReportsService = ProductionReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductionReportsService);
//# sourceMappingURL=production-reports.service.js.map