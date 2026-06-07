export declare class CreatePriceListDto {
    code: string;
    name: string;
    description?: string;
    listType?: string;
    currency?: string;
    isDefault?: boolean;
}
export declare class UpdatePriceListDto {
    name?: string;
    description?: string;
    currency?: string;
    isDefault?: boolean;
    isActive?: boolean;
}
export declare class CreatePriceListItemDto {
    itemType: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    uom?: string;
    price: number;
    minQty?: number;
    validFrom?: string;
    validTo?: string;
}
export declare class UpdatePriceListItemDto {
    price?: number;
    minQty?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
}
