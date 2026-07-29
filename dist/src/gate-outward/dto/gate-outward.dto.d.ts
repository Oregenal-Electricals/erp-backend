export declare class CreateGateOutwardDto {
    plantId: string;
    vehicleLogId?: string;
    customerName: string;
    customerMobile?: string;
    customerAddress?: string;
    customerGstin?: string;
    salesOrderNumber?: string;
    deliveryChallanNumber?: string;
    invoiceNumber?: string;
    invoiceAmount?: number;
    materialDescription: string;
    quantity: number;
    unit?: string;
    grossWeight?: number;
    netWeight?: number;
    packageCount?: number;
    remarks?: string;
}
export declare class UpdateGateOutwardDto {
    customerName?: string;
    salesOrderNumber?: string;
    deliveryChallanNumber?: string;
    materialDescription?: string;
    quantity?: number;
    remarks?: string;
}
export declare class ApproveGateOutwardDto {
    remarks?: string;
}
export declare class CancelGateOutwardDto {
    cancelReason: string;
}
