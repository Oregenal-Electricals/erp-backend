export declare class DispatchItemDto {
    planItemId?: string;
    soItemId: string;
    itemCode: string;
    itemName: string;
    dispatchedQty: number;
    uom?: string;
    unitPrice?: number;
    gstRate?: number;
}
export declare class CreateDispatchDto {
    planId: string;
    dispatchDate?: string;
    deliveryAddress?: string;
    vehicleNumber?: string;
    transporterName?: string;
    driverName?: string;
    driverPhone?: string;
    lrNumber?: string;
    ewayBillNumber?: string;
    remarks?: string;
    items: DispatchItemDto[];
}
