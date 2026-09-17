export declare class CreatePickListDto {
    dispatchPlanId: string;
}
export declare class PickItemDto {
    dispatchReservationId: string;
    batchId?: string;
    pickQty: number;
}
export declare class ReversePickDto {
    reverseQty: number;
    reason?: string;
}
