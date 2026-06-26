export declare class ImportPoItemDto {
    sequence?: number;
    itemCode: string;
    itemName: string;
    hsnCode?: string;
    uom: string;
    orderedQty: number;
    unitPriceForeign: number;
    discount?: number;
    taxRate?: number;
    bcdRate?: number;
}
export declare class CreateImportPoDto {
    vendorId: string;
    prId?: string;
    deliveryDate: string;
    currency?: string;
    exchangeRate: number;
    incoterms?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    paymentTerms?: string;
    paymentMode?: string;
    notes?: string;
    termsConditions?: string;
    items?: ImportPoItemDto[];
}
export declare class UpdateImportPoDto {
    deliveryDate?: string;
    exchangeRate?: number;
    portOfLoading?: string;
    portOfDischarge?: string;
    paymentTerms?: string;
    notes?: string;
}
