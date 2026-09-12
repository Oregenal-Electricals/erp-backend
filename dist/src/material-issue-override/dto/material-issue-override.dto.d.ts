export declare class RequestOverrideDto {
    workOrderId: string;
    itemCode: string;
    itemName: string;
    requestedQty: number;
    reason: string;
}
export declare class DecideOverrideDto {
    action: string;
    approvedQty?: number;
    comments?: string;
}
