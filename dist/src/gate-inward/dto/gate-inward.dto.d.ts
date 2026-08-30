export declare class GateInwardItemDto {
    poItemId?: string;
    itemCode: string;
    itemName: string;
    uom?: string;
    quantity: number;
    packageCount?: number;
    remarks?: string;
}
export declare class CreateGateInwardDto {
    plantId: string;
    vehicleLogId?: string;
    vehicleNumber?: string;
    driverName?: string;
    supplierName: string;
    supplierMobile?: string;
    supplierGstin?: string;
    poId?: string;
    poNumber?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: number;
    materialDescription?: string;
    quantity?: number;
    unit?: string;
    items?: GateInwardItemDto[];
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
export declare class GateInDto {
    remarks?: string;
}
export declare class ResolveHoldWithPoDto {
    poId: string;
    remarks?: string;
}
export declare class ResolveHoldAsNonPoDto {
    remarks: string;
}
export declare class ResolveHoldAsRejectedDto {
    rejectionReason: string;
}
export declare class ReturnMaterialDto {
    reason: string;
}
export declare class ApprovedExceptionDto {
    reason: string;
}
export declare class CorrectPoReferenceDto {
    poId: string;
    reason: string;
}
export declare class FlagMismatchDto {
    mismatchType: 'VENDOR' | 'MATERIAL';
    expectedValue: string;
    actualValue: string;
    remarks: string;
}
export declare class ResolveMismatchCorrectReferenceDto {
    correctedValue: string;
    reason: string;
}
export declare class ResolveMismatchApprovedExceptionDto {
    reason: string;
}
export declare class ResolveMismatchRejectedDto {
    reason: string;
}
export declare class FlagDamageDto {
    damageType: 'MATERIAL' | 'PACKAGING';
    description: string;
    affectedPackages?: string;
    gateRecommendation: 'REJECT' | 'ACCEPT_EXCEPTION';
}
export declare class ResolveDamageRejectDto {
    reason: string;
}
export declare class ResolveDamageAcceptExceptionDto {
    reason: string;
}
export declare class RecordReturnGateOutDto {
    remarks: string;
}
