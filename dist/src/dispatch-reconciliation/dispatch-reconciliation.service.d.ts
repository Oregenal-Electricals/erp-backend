import { PrismaService } from '../prisma/prisma.service';
export declare class DispatchReconciliationService {
    private prisma;
    constructor(prisma: PrismaService);
    private netItem;
    reconcilePlan(planId: string, user: any): Promise<{
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
    reconcileSalesOrder(soId: string, user: any): Promise<{
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
    reconcileSfgStage(workOrderId: string, user: any): Promise<{
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
    checkCriticalConsistency(gateOutId: string, user: any): Promise<{
        gateOutId: string;
        gateOutNumber: string;
        consistent: boolean;
        issues: string[];
    }>;
}
