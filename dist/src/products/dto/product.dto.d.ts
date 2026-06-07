export declare class CreateProductDto {
    code: string;
    name: string;
    description?: string;
    productType?: string;
    categoryId?: string;
    uomId?: string;
    hsnCode?: string;
    gstRate?: number;
    brand?: string;
    model?: string;
    revision?: string;
    drawingNumber?: string;
    specifications?: Record<string, any>;
    minOrderQty?: number;
    leadTimeDays?: number;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    productType?: string;
    categoryId?: string;
    uomId?: string;
    hsnCode?: string;
    gstRate?: number;
    brand?: string;
    model?: string;
    revision?: string;
    drawingNumber?: string;
    specifications?: Record<string, any>;
    minOrderQty?: number;
    leadTimeDays?: number;
    isActive?: boolean;
}
