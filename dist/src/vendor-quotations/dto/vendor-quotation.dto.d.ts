export declare class CreateVendorQuotationDto {
    rfqId: string;
    vendorId: string;
    validUntil: string;
    deliveryDays?: number;
    paymentTerms?: string;
    currency?: string;
    notes?: string;
}
export declare class UpdateVendorQuotationDto {
    validUntil?: string;
    deliveryDays?: number;
    paymentTerms?: string;
    notes?: string;
}
export declare class CreateQuotationItemDto {
    rfqItemId?: string;
    itemCode: string;
    itemName: string;
    uom: string;
    requiredQty: number;
    quotedQty: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    deliveryDays?: number;
    notes?: string;
}
export declare class UpdateQuotationItemDto {
    quotedQty?: number;
    unitPrice?: number;
    discount?: number;
    taxRate?: number;
    deliveryDays?: number;
    notes?: string;
}
