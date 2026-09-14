export declare class RequestRtvDto {
    rejectedStockItemId: string;
    requestedQty: number;
    reason: string;
    remarks?: string;
}
export declare class DecideRtvDto {
    action: string;
    approvedQty?: number;
    comments?: string;
}
export declare class PrepareRtvDto {
    preparedQty: number;
}
export declare class GateOutRtvDto {
    qty: number;
    vehicleNumber?: string;
    challanNumber?: string;
    remarks?: string;
}
