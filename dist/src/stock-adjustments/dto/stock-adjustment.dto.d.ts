export declare class AdjustmentItemDto {
    itemCode: string;
    itemName: string;
    uom: string;
    physicalQty: number;
    unitCost: number;
    status?: string;
    binId?: string;
    batchId?: string;
}
export declare class CreateAdjustmentDto {
    warehouseId: string;
    adjustmentType: string;
    reason: string;
    remarks?: string;
    items: AdjustmentItemDto[];
}
