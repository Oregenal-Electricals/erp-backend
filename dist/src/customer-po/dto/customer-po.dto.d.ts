export declare class CpoItemDto {
    itemCode: string;
    itemName: string;
    description?: string;
    qty: number;
    uom?: string;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
}
export declare class CreateCpoDto {
    customerPoNumber: string;
    quotationId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    poDate: string;
    deliveryDate: string;
    currency?: string;
    remarks?: string;
    items: CpoItemDto[];
}
export declare class CancelCpoDto {
    cancelReason: string;
}
