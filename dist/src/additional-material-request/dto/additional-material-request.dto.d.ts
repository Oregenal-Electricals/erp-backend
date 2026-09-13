export declare class RequestAdditionalMaterialDto {
    workOrderId: string;
    itemCode: string;
    itemName: string;
    requestedQty: number;
    reasonCategory: string;
    reason: string;
}
export declare class DecideAdditionalMaterialDto {
    action: string;
    approvedQty?: number;
    comments?: string;
}
