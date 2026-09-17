import { DispatchReservationService } from './dispatch-reservation.service';
import { CreateReservationDto, ReleaseReservationDto } from './dto/dispatch-reservation.dto';
export declare class DispatchReservationController {
    private readonly drService;
    constructor(drService: DispatchReservationService);
    findByPlanItem(dispatchPlanItemId: string, req: any): Promise<({
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
    findOne(reservationNumber: string, req: any): Promise<({
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
    reserve(dto: CreateReservationDto, req: any): Promise<{
        reservationNumber: string;
        requestedQty: number;
        reservedQty: number;
        unreservedQty: number;
        status: string;
        allocations: any[];
    }>;
    release(reservationNumber: string, dto: ReleaseReservationDto, req: any): Promise<{
        reservationNumber: string;
        releasedQty: number;
        rows: any[];
    }>;
}
