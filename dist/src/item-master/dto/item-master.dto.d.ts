import { ItemType, ItemStatus } from '@prisma/client';
export declare class CreateUomDto {
    code: string;
    name: string;
    description?: string;
    isBase?: boolean;
}
export declare class UpdateUomDto {
    name?: string;
    description?: string;
    isBase?: boolean;
}
export declare class CreateCategoryDto {
    code: string;
    name: string;
    description?: string;
    parentId?: string;
}
export declare class UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: string;
}
export declare class CreateItemDto {
    itemCode: string;
    itemName: string;
    shortName?: string;
    description?: string;
    itemType: ItemType;
    categoryId?: string;
    uomId: string;
    purchaseUomId?: string;
    salesUomId?: string;
    hsnCode?: string;
    gstRate?: number;
    purchaseRate?: number;
    salesRate?: number;
    standardCost?: number;
    reorderLevel?: number;
    reorderQty?: number;
    minOrderQty?: number;
    maxOrderQty?: number;
    leadTimeDays?: number;
    shelfLifeDays?: number;
    isBatchTracked?: boolean;
    isSerialTracked?: boolean;
    drawingNo?: string;
    barcode?: string;
    abcClass?: string;
    criticalityLevel?: string;
}
export declare class UpdateItemDto {
    itemName?: string;
    shortName?: string;
    description?: string;
    status?: ItemStatus;
    categoryId?: string;
    hsnCode?: string;
    gstRate?: number;
    purchaseRate?: number;
    salesRate?: number;
    standardCost?: number;
    reorderLevel?: number;
    reorderQty?: number;
    leadTimeDays?: number;
    isBatchTracked?: boolean;
    isSerialTracked?: boolean;
    drawingNo?: string;
    abcClass?: string;
    criticalityLevel?: string;
}
