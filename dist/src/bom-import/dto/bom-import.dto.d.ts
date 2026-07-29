export declare class ConfirmImportItemDto {
    partCode?: string;
    itemCode: string;
    itemName: string;
    package?: string;
    quantity: number;
    uom: string;
    location?: string;
    preferredMake?: string;
    alternateMakes?: string;
    rawMaterialId?: string;
}
export declare class ConfirmImportSectionDto {
    name: string;
    items: ConfirmImportItemDto[];
}
export declare class ConfirmImportProductDto {
    code?: string;
    name?: string;
    brand?: string;
    description?: string;
}
export declare class ConfirmBomImportDto {
    useExistingProductId?: string;
    product: ConfirmImportProductDto;
    bomVersion?: string;
    sections: ConfirmImportSectionDto[];
}
