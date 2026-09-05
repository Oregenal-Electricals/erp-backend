import { ProductionReportsService } from './production-reports.service';
export declare class ProductionReportsController {
    private readonly prService;
    constructor(prService: ProductionReportsService);
    getWoCompletion(req: any, query: any): Promise<{
        data: {
            woNumber: string;
            productCode: string;
            productName: string;
            status: string;
            priority: string;
            warehouse: string;
            plannedQty: number;
            completedQty: number;
            rejectedQty: number;
            achievementPct: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date;
            actualEndDate: Date;
            totalCost: number;
            unitCost: number;
        }[];
        totalWos: number;
        avgAchievement: number;
        totalPlanned: number;
        totalCompleted: number;
    }>;
    getShiftProduction(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                productName: string;
                woNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            shift: string;
            status: string;
            remarks: string | null;
            workOrderId: string;
            productivityRateSnapshot: number | null;
            labourRateSnapshot: number | null;
            reworkQty: number;
            goodQty: number;
            scrapQty: number;
            manpowerQty: number | null;
            targetQty: number | null;
            achievementPercent: number | null;
            actualLabourHours: number | null;
            actualLabourCost: number | null;
            downtimeMinutes: number;
            totalQty: number;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            periodStart: Date | null;
            periodEnd: Date | null;
            downtimeReason: string | null;
            entryNumber: string;
        })[];
        totalEntries: number;
        byShift: any[];
        byOperator: any[];
        totalGoodQty: number;
        totalScrapQty: number;
    }>;
    getMaterialConsumption(req: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        totalValue: any;
    }>;
    getScrapAnalysis(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            shift: string;
            status: string;
            remarks: string | null;
            workOrderId: string;
            productivityRateSnapshot: number | null;
            labourRateSnapshot: number | null;
            reworkQty: number;
            goodQty: number;
            scrapQty: number;
            manpowerQty: number | null;
            targetQty: number | null;
            achievementPercent: number | null;
            actualLabourHours: number | null;
            actualLabourCost: number | null;
            downtimeMinutes: number;
            totalQty: number;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            periodStart: Date | null;
            periodEnd: Date | null;
            downtimeReason: string | null;
            entryNumber: string;
        })[];
        byProduct: any[];
        totalScrap: number;
        totalGood: number;
        overallScrapRate: number;
    }>;
    getQualitySummary(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
            };
        } & {
            result: string;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            acceptedQty: number;
            sampleSize: number;
            workOrderId: string;
            qcNumber: string;
            productionEntryId: string | null;
            inspectionStage: string;
            inspectorName: string | null;
            inspectionDate: Date;
            passQty: number;
            failQty: number;
            reworkQty: number;
            holdQty: number;
            fgHandedOverQty: number;
            sourceReworkId: string | null;
            defectDescription: string | null;
            correctiveAction: string | null;
        })[];
        byStage: any[];
        totalInspections: number;
        overallPassRate: number;
    }>;
}
