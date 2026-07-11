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
                woNumber: string;
                productName: string;
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
            machineName: string | null;
            status: string;
            remarks: string | null;
            workOrderId: string;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            goodQty: number;
            scrapQty: number;
            totalQty: number;
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
                woNumber: string;
                productCode: string;
                productName: string;
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
            machineName: string | null;
            status: string;
            remarks: string | null;
            workOrderId: string;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            goodQty: number;
            scrapQty: number;
            totalQty: number;
        })[];
        byProduct: any[];
        totalScrap: number;
        totalGood: number;
        overallScrapRate: number;
    }>;
    getQualitySummary(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                woNumber: string;
                productCode: string;
                productName: string;
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
            result: string;
            status: string;
            remarks: string | null;
            correctiveAction: string | null;
            workOrderId: string;
            inspectionDate: Date;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            qcNumber: string;
            productionEntryId: string | null;
            inspectionStage: string;
            defectDescription: string | null;
        })[];
        byStage: any[];
        totalInspections: number;
        overallPassRate: number;
    }>;
}
