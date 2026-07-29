export declare class AdjustmentItemDto {
    itemCode: string;
    itemName: string;
    uom: string;
    systemQty: number;
    physicalQty: number;
    unitCost: number;
}
export declare class CreateAdjustmentDto {
    warehouseId: string;
    adjustmentType: string;
    reason: string;
    remarks?: string;
    items: AdjustmentItemDto[];
}
