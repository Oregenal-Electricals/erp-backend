import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class DispatchReservationService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    private claimRmFgAtomically;
    private claimSfgAtomically;
    reserve(dispatchPlanItemId: string, requestedQty: number, user: any): Promise<{
        reservationNumber: string;
        requestedQty: number;
        reservedQty: number;
        unreservedQty: number;
        status: string;
        allocations: any[];
    }>;
    release(reservationNumber: string, releaseQty: number, reason: string | undefined, user: any): Promise<{
        reservationNumber: string;
        releasedQty: number;
        rows: any[];
    }>;
    findOne(reservationNumber: string, user: any): Promise<({
        workOrder: {
            woNumber: string;
        };
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        requiredStage: {
            stageName: string;
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
        status: string;
        itemCode: string;
        itemName: string;
        warehouseId: string | null;
        requiredStageId: string | null;
        soId: string;
        reservedQty: number;
        soItemId: string;
        workOrderId: string | null;
        releasedQty: number;
        reservationNumber: string;
        reservationType: string;
        releaseReason: string | null;
        dispatchPlanId: string;
        dispatchPlanItemId: string;
    })[]>;
    findByPlanItem(dispatchPlanItemId: string, user: any): Promise<({
        workOrder: {
            woNumber: string;
        };
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        requiredStage: {
            stageName: string;
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
        status: string;
        itemCode: string;
        itemName: string;
        warehouseId: string | null;
        requiredStageId: string | null;
        soId: string;
        reservedQty: number;
        soItemId: string;
        workOrderId: string | null;
        releasedQty: number;
        reservationNumber: string;
        reservationType: string;
        releaseReason: string | null;
        dispatchPlanId: string;
        dispatchPlanItemId: string;
    })[]>;
}
