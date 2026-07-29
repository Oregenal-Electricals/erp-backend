export declare class SelectItemDto {
    rfqItemId: string;
    selectedVendorId: string;
    selectedQuotationId: string;
    selectedItemId: string;
    selectionReason?: string;
}
export declare class SelectVendorsDto {
    selections: SelectItemDto[];
}
