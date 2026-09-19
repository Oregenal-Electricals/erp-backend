import { DispatchReconciliationService } from './dispatch-reconciliation.service';
import { DispatchTraceService } from './dispatch-trace.service';
import { DispatchDashboardService } from './dispatch-dashboard.service';
export declare class DispatchReconciliationController {
    private readonly reconciliation;
    private readonly traceService;
    private readonly dashboard;
    constructor(reconciliation: DispatchReconciliationService, traceService: DispatchTraceService, dashboard: DispatchDashboardService);
    getDashboard(req: any): Promise<{
        dispatchOrdersPending: number;
        stockReservationPending: number;
        pickingPending: number;
        documentsPending: number;
        vehiclePending: number;
        loadingPending: number;
        readyForGateOut: number;
        gateOutPending: number;
        partiallyDispatched: number;
        reconciliationExceptions: number;
    }>;
    reconcilePlan(planId: string, req: any): Promise<{
        dispatchPlanId: string;
        planNumber: string;
        status: string;
        quantityChain: {
            stage: string;
            qty: any;
        }[];
        explanations: string[];
        reconciliationStatus: string;
    }>;
    reconcileSalesOrder(soId: string, req: any): Promise<{
        soId: string;
        soNumber: string;
        customerName: string;
        status: string;
        fulfilmentStatus: string;
        lines: {
            soItemId: any;
            itemCode: any;
            itemName: any;
            saleType: any;
            orderedQty: any;
            actualDispatchedQty: any;
            actualGateOutQty: any;
            remainingQty: any;
            consistent: boolean;
        }[];
    }>;
    reconcileSfgStage(workOrderId: string, req: any): Promise<{
        workOrderId: string;
        stageName: string;
        itemCode: string;
        acceptedOutput: number;
        transferredToNextStage: number;
        dispatchedAsSfg: any;
        activeDispatchReserved: number;
        remainingWip: number;
        reconciliationResult: string;
        varianceQty: number;
    }>;
    checkConsistency(gateOutId: string, req: any): Promise<{
        gateOutId: string;
        gateOutNumber: string;
        consistent: boolean;
        issues: string[];
    }>;
    trace(packageNumber: string, gateOutNumber: string, soNumber: string, req: any): Promise<{
        packageId: string;
        packageNumber: string;
        currentStatus: string;
        timeline: any[];
        sourceTrace: ({
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber: string;
            workOrderNumber?: undefined;
            stageName?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            workOrderNumber: string;
            stageName: string;
            batchNumber?: undefined;
        } | {
            itemCode: string;
            saleType: string;
            source: string;
            batchNumber?: undefined;
            workOrderNumber?: undefined;
            stageName?: undefined;
        })[];
    }[]>;
}
