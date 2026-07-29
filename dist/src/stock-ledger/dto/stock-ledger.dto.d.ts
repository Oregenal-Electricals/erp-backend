export declare class ReceiveStockDto {
    iqcId: string;
}
export declare class AdjustStockDto {
    itemCode: string;
    warehouseId: string;
    qty: number;
    adjustmentType: string;
    unitCost: number;
    remarks?: string;
}
