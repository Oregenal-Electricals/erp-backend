export declare class PoItemDto {
    sequence?: number;
    prItemId?: string;
    quotationItemId?: string;
    itemCode: string;
    itemName: string;
    hsnCode?: string;
    uom: string;
    orderedQty: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
}
export declare class CreatePurchaseOrderDto {
    rfqId?: string;
    vendorId: string;
    prId?: string;
    deliveryDate: string;
    deliveryAddress?: string;
    paymentTerms?: string;
    currency?: string;
    notes?: string;
    termsConditions?: string;
    items?: PoItemDto[];
}
export declare class UpdatePurchaseOrderDto {
    deliveryDate?: string;
    deliveryAddress?: string;
    paymentTerms?: string;
    notes?: string;
    termsConditions?: string;
}
export declare class UpdatePoItemDto {
    orderedQty?: number;
    unitPrice?: number;
    discount?: number;
    taxRate?: number;
    hsnCode?: string;
}
