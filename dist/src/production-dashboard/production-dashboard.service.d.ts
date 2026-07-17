import { PrismaService } from '../prisma/prisma.service';
export declare class ProductionDashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverview(user: any): Promise<{
        workOrders: {
            total: number;
            draft: number;
            released: number;
            inProgress: number;
            completed: number;
            cancelled: number;
        };
        today: {
            goodQty: number;
            scrapQty: number;
            totalQty: number;
            entries: number;
        };
        fgReceipts: {
            total: number;
            pendingFgr: number;
        };
        quality: {
            totalInspections: number;
            overallPassRate: number;
        };
        costs: {
            totalProductionCost: number;
            totalMaterialCost: number;
        };
    }>;
    getActiveWos(user: any): Promise<{
        id: string;
        woNumber: string;
        productCode: string;
        productName: string;
        status: string;
        priority: string;
        plannedQty: number;
        completedQty: number;
        progressPct: number;
        isOverdue: boolean;
        daysLeft: number;
        warehouse: string;
        materialIssued: boolean;
        plannedEndDate: Date;
    }[]>;
    getToday(user: any): Promise<{
        entries: ({
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
            totalQty: number;
            workOrderId: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
        })[];
        byShift: {
            shift: string;
            entries: number;
            goodQty: number;
            scrapQty: number;
        }[];
        totalGoodQty: number;
        totalScrapQty: number;
    }>;
    getAlerts(user: any): Promise<{
        overdueWos: {
            status: string;
            woNumber: string;
            productName: string;
            plannedEndDate: Date;
        }[];
        releasedNoIssue: {
            woNumber: string;
            productName: string;
            plannedStartDate: Date;
        }[];
        failedQc: ({
            workOrder: {
                woNumber: string;
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
        pendingFgr: {
            woNumber: string;
            productName: string;
            completedQty: number;
        }[];
        totalAlerts: number;
    }>;
    getQualityMetrics(user: any): Promise<{
        inspections: ({
            workOrder: {
                woNumber: string;
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
        byResult: {
            PASS: number;
            FAIL: number;
            CONDITIONAL: number;
        };
        totalSampled: number;
        totalPassed: number;
        overallPassRate: number;
    }>;
}
