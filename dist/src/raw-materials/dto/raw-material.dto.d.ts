export declare class CreateRawMaterialDto {
    code: string;
    name: string;
    description?: string;
    materialType?: string;
    categoryId?: string;
    uomId?: string;
    hsnCode?: string;
    gstRate?: number;
    brand?: string;
    partNumber?: string;
    specifications?: Record<string, any>;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderQty?: number;
    leadTimeDays?: number;
}
export declare class UpdateRawMaterialDto {
    name?: string;
    description?: string;
    materialType?: string;
    categoryId?: string;
    uomId?: string;
    hsnCode?: string;
    gstRate?: number;
    brand?: string;
    partNumber?: string;
    specifications?: Record<string, any>;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderQty?: number;
    leadTimeDays?: number;
    isActive?: boolean;
}
