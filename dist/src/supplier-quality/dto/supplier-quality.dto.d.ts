export declare class CreateSupplierRatingDto {
    vendorId: string;
    period: string;
    periodType?: string;
    totalReceived: number;
    totalRejected: number;
    onTimeDelivery?: number;
    remarks?: string;
}
export declare class CreateCarDto {
    vendorId: string;
    ncrId?: string;
    description: string;
    severity?: string;
    dueDate: string;
    remarks?: string;
}
export declare class RespondCarDto {
    supplierResponse: string;
    supplierRootCause: string;
    supplierAction: string;
}
export declare class VerifyCarDto {
    remarks?: string;
}
