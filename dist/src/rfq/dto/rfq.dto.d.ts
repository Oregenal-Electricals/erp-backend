export declare class CreateRfqDto {
    prId: string;
    title: string;
    description?: string;
    responseDeadline: string;
    deliveryLocation?: string;
    paymentTerms?: string;
    notes?: string;
    vendorIds?: string[];
    prItemIds?: string[];
}
export declare class UpdateRfqDto {
    title?: string;
    description?: string;
    responseDeadline?: string;
    deliveryLocation?: string;
    paymentTerms?: string;
    notes?: string;
}
export declare class AddRfqVendorDto {
    vendorId: string;
}
export declare class AddRfqItemDto {
    prItemId?: string;
    itemCode: string;
    itemName: string;
    uom: string;
    requiredQty?: number;
    notes?: string;
}
