export declare class CreateGateInwardDto {
    plantId: string;
    vehicleLogId?: string;
    supplierName: string;
    supplierMobile?: string;
    supplierGstin?: string;
    poId?: string;
    poNumber?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: number;
    materialDescription: string;
    quantity: number;
    unit?: string;
    grossWeight?: number;
    netWeight?: number;
    packageCount?: number;
    remarks?: string;
}
export declare class UpdateGateInwardDto {
    supplierName?: string;
    poNumber?: string;
    invoiceNumber?: string;
    quantity?: number;
    materialDescription?: string;
    remarks?: string;
}
export declare class VerifyGateInwardDto {
    remarks?: string;
}
export declare class RejectGateInwardDto {
    rejectionReason: string;
}
