export declare class CreateFgReceiptDto {
    workOrderId: string;
    warehouseId: string;
    receivedQty: number;
    rejectedQty?: number;
    batchNumber?: string;
    unitCost?: number;
    remarks?: string;
}
