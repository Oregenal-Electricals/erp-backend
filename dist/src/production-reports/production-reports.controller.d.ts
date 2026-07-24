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
            totalQty: number;
            workOrderId: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            goodQty: number;
            scrapQty: number;
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
            totalQty: number;
            workOrderId: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            goodQty: number;
            scrapQty: number;
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
            inspectionDate: Date;
            workOrderId: string;
            productionEntryId: string | null;
            inspectionStage: string;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            defectDescription: string | null;
            correctiveAction: string | null;
            qcNumber: string;
        })[];
        byStage: any[];
        totalInspections: number;
        overallPassRate: number;
    }>;
}
