import { PrismaService } from '../prisma/prisma.service';
export declare class ProductionReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private dateWhere;
    getWoCompletionReport(user: any, query: any): Promise<{
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
    getShiftProductionReport(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                productName: string;
                woNumber: string;
            };
        } & {
            shift: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
    getMaterialConsumptionReport(user: any, query: any): Promise<{
        data: any[];
        totalItems: number;
        totalValue: any;
    }>;
    getScrapAnalysis(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
            };
        } & {
            shift: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
    getQualitySummary(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
            };
        } & {
            result: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
