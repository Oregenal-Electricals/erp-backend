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
            productName: string;
            woNumber: string;
            plannedEndDate: Date;
        }[];
        releasedNoIssue: {
            productName: string;
            woNumber: string;
            plannedStartDate: Date;
        }[];
        failedQc: ({
            workOrder: {
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
        pendingFgr: {
            productName: string;
            woNumber: string;
            completedQty: number;
        }[];
        totalAlerts: number;
    }>;
    getQualityMetrics(user: any): Promise<{
        inspections: ({
            workOrder: {
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
