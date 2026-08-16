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
            workOrderId: string;
            totalQty: number;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
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
        byResult: {
            PASS: number;
            FAIL: number;
            CONDITIONAL: number;
        };
        totalSampled: number;
        totalPassed: number;
        overallPassRate: number;
    }>;
    getHourlyMonitoring(user: any, dateStr?: string): Promise<{
        date: string;
        workOrders: {
            active: {
                id: string;
                woNumber: string;
                productCode: string;
                productName: string;
                stageName: string;
                status: string;
                plannedQty: number;
                completedQty: number;
                progressPct: number;
                allocatedManpower: number;
                efficiencyPct: number;
            }[];
            activeCount: number;
            startedToday: number;
            completedToday: number;
        };
        hourlyOutput: {
            goodQty: number;
            scrapQty: number;
            entries: number;
            hour: string;
        }[];
        stageWiseOutput: {
            stageName: string;
            goodQty: number;
            scrapQty: number;
            workOrderCount: number;
        }[];
        manpower: {
            totalAllocatedToday: number;
            idleHeadcount: number;
            utilizationPct: number;
        };
        transfers: {
            todayCount: number;
            list: {
                id: string;
                itemCode: string;
                itemName: string;
                qty: number;
                status: string;
                fromWoNumber: string;
                fromStage: string;
                toWoNumber: string;
                toStage: string;
                givenAt: Date;
                receivedAt: Date;
            }[];
        };
        efficiency: {
            overallGoodVsTotalPct: number;
        };
        costing: {
            assumptionNote: string;
            totalManpowerCostToday: number;
            headcountWithoutRate: number;
            perStage: {
                stageName: string;
                headcount: number;
                estimatedCost: number;
            }[];
        };
    }>;
}
