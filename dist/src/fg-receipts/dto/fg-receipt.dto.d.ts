export declare class CreateFgReceiptDto {
    workOrderId: string;
    warehouseId: string;
    receivedQty: number;
    rejectedQty?: number;
    batchNumber?: string;
    unitCost?: number;
    remarks?: string;
}
export declare class CreateFgReceiptFromQcDto {
    productionQcId: string;
    warehouseId: string;
    qty: number;
    batchNumber?: string;
    unitCost?: number;
    remarks?: string;
}
