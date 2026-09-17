import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class PickListService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    createPickList(dispatchPlanId: string, user: any): Promise<{
        items: ({
            dispatchReservation: {
                warehouseId: string;
                reservedQty: number;
                workOrderId: string;
                releasedQty: number;
                reservationNumber: string;
                reservationType: string;
            };
            batch: {
                batchNumber: string;
                lotNumber: string;
            };
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            itemCode: string;
            itemName: string;
            saleType: string;
            soItemId: string;
            batchId: string | null;
            pickedQty: number;
            reversedQty: number;
            pickListId: string;
            dispatchReservationId: string;
        })[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
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
        remarks: string | null;
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        pickListNumber: string;
    }>;
    private remainingToPick;
    private claimBatchAtomically;
    pickItem(pickListId: string, dispatchReservationId: string, batchId: string | undefined, pickQty: number, user: any): Promise<{
        requestedQty: number;
        shortQty: number;
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        soItemId: string;
        batchId: string | null;
        pickedQty: number;
        reversedQty: number;
        pickListId: string;
        dispatchReservationId: string;
    }>;
    private refreshPickListStatus;
    reversePick(pickListItemId: string, reverseQty: number, reason: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        itemCode: string;
        itemName: string;
        saleType: string;
        soItemId: string;
        batchId: string | null;
        pickedQty: number;
        reversedQty: number;
        pickListId: string;
        dispatchReservationId: string;
    }>;
    findOne(id: string, user: any): Promise<{
        items: ({
            dispatchReservation: {
                warehouseId: string;
                reservedQty: number;
                workOrderId: string;
                releasedQty: number;
                reservationNumber: string;
                reservationType: string;
            };
            batch: {
                batchNumber: string;
                lotNumber: string;
            };
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            itemCode: string;
            itemName: string;
            saleType: string;
            soItemId: string;
            batchId: string | null;
            pickedQty: number;
            reversedQty: number;
            pickListId: string;
            dispatchReservationId: string;
        })[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
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
        remarks: string | null;
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        pickListNumber: string;
    }>;
    suggestBatches(dispatchReservationId: string, user: any): Promise<{
        batchId: string;
        batchNumber: string;
        lotNumber: string;
        freeQty: number;
    }[]>;
}
