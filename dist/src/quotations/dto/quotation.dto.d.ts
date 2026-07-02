export declare class QuotationItemDto {
    itemCode: string;
    itemName: string;
    description?: string;
    qty: number;
    uom?: string;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
}
export declare class CreateQuotationDto {
    leadId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    validUntil: string;
    currency?: string;
    termsConditions?: string;
    notes?: string;
    items: QuotationItemDto[];
}
export declare class UpdateQuotationDto {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    validUntil?: string;
    termsConditions?: string;
    notes?: string;
    items?: QuotationItemDto[];
}
export declare class RejectQuotationDto {
    rejectedReason: string;
}
