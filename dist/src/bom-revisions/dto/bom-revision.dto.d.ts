export declare class CreateBomRevisionDto {
    productId: string;
    bomId: string;
    previousBomId?: string;
    revisionNumber: string;
    changeType?: string;
    changeDescription: string;
    ecnNumber?: string;
    effectiveDate?: string;
}
