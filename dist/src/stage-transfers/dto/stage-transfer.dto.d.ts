export declare class GiveTransferDto {
    fromWorkOrderId: string;
    toWorkOrderId: string;
    qty?: number;
    remarks?: string;
}
export declare class GiveToQcDto {
    fromWorkOrderId: string;
    qty?: number;
    batchLot?: string;
    remarks?: string;
}
