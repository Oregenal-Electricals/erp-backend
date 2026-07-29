export declare class PiItemDto {
    sequence?: number;
    ipoItemId?: string;
    itemCode: string;
    itemName: string;
    hsnCode?: string;
    uom: string;
    qty: number;
    unitPriceForeign: number;
}
export declare class CreateProformaInvoiceDto {
    ipoId: string;
    vendorPiNumber?: string;
    piDate?: string;
    validUntil?: string;
    bankName?: string;
    bankAddress?: string;
    swiftCode?: string;
    notes?: string;
    items?: PiItemDto[];
}
export declare class UpdateProformaInvoiceDto {
    vendorPiNumber?: string;
    validUntil?: string;
    bankName?: string;
    bankAddress?: string;
    swiftCode?: string;
    notes?: string;
}
export declare class RejectPiDto {
    rejectionReason: string;
}
