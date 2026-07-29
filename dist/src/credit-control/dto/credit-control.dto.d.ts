export declare class CreateCreditLimitDto {
    customerName: string;
    creditLimit: number;
    creditDays?: number;
    notes?: string;
}
export declare class UpdateCreditLimitDto {
    creditLimit?: number;
    creditDays?: number;
    notes?: string;
}
export declare class ReleaseCreditHoldDto {
    releaseReason: string;
}
export declare class CheckCreditDto {
    customerName: string;
    orderAmount: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
}
