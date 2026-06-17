export declare class CreateBomDto {
    productId: string;
    revisionId?: string;
    version?: string;
    description?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
}
export declare class UpdateBomDto {
    version?: string;
    description?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActive?: boolean;
}
export declare class CreateBomItemDto {
    sequence?: number;
    itemType?: string;
    rawMaterialId?: string;
    itemCode: string;
    itemName: string;
    uom: string;
    quantity: number;
    wastagePercent?: number;
    unitCost?: number;
    isCritical?: boolean;
    notes?: string;
}
export declare class UpdateBomItemDto {
    sequence?: number;
    itemType?: string;
    rawMaterialId?: string;
    itemCode?: string;
    itemName?: string;
    uom?: string;
    quantity?: number;
    wastagePercent?: number;
    unitCost?: number;
    isCritical?: boolean;
    notes?: string;
    isActive?: boolean;
}
