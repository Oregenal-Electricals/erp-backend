export declare class VerifyLineBatchDto {
    batchNumber: string;
    lotNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    quantity: number;
}
export declare class VerifyLineDto {
    actualQty: number;
    actualUom: string;
    materialMismatch?: boolean;
    mismatchDescription?: string;
    damagedQty?: number;
    batches?: VerifyLineBatchDto[];
    remarks?: string;
}
export declare class CorrectLineDto {
    actualQty: number;
    reason: string;
}
