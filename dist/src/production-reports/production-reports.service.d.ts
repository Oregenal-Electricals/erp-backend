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
            status: string;
            remarks: string | null;
            workOrderId: string;
            totalQty: number;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
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
            status: string;
            remarks: string | null;
            workOrderId: string;
            totalQty: number;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
        })[];
        byProduct: any[];
        totalScrap: number;
        totalGood: number;
        overallScrapRate: number;
    }>;
    getQualitySummary(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                woNumber: string;
                productCode: string;
                productName: string;
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
            workOrderId: string;
            qcNumber: string;
            productionEntryId: string | null;
            inspectionStage: string;
            inspectorName: string | null;
            inspectionDate: Date;
            sampleSize: number;
            passQty: number;
            failQty: number;
            defectDescription: string | null;
            correctiveAction: string | null;
        })[];
        byStage: any[];
        totalInspections: number;
        overallPassRate: number;
    }>;
}
