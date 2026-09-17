import { PickListService } from './pick-list.service';
import { CreatePickListDto, PickItemDto, ReversePickDto } from './dto/pick-list.dto';
export declare class PickListController {
    private readonly plService;
    constructor(plService: PickListService);
    suggestBatches(dispatchReservationId: string, req: any): Promise<{
        batchId: string;
        batchNumber: string;
        lotNumber: string;
        freeQty: number;
    }[]>;
    findOne(id: string, req: any): Promise<{
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
    createPickList(dto: CreatePickListDto, req: any): Promise<{
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
    pickItem(pickListId: string, dto: PickItemDto, req: any): Promise<{
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
    reversePick(pickListItemId: string, dto: ReversePickDto, req: any): Promise<{
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
}
