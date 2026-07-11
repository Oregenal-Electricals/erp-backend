import { ProductionDashboardService } from './production-dashboard.service';
export declare class ProductionDashboardController {
    private readonly pdService;
    constructor(pdService: ProductionDashboardService);
    getOverview(req: any): Promise<{
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
    getActiveWos(req: any): Promise<{
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
    getToday(req: any): Promise<{
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
        byShift: {
            shift: string;
            entries: number;
            goodQty: number;
            scrapQty: number;
        }[];
        totalGoodQty: number;
        totalScrapQty: number;
    }>;
    getAlerts(req: any): Promise<{
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
        pendingFgr: {
            woNumber: string;
            productName: string;
            completedQty: number;
        }[];
        totalAlerts: number;
    }>;
    getQuality(req: any): Promise<{
        inspections: ({
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
