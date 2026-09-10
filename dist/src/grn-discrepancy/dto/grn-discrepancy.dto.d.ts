export declare class RaiseDiscrepancyDto {
    affectedQty: number;
    problemType: string;
    damageType?: string;
    physicalItemCode?: string;
    physicalItemName?: string;
    physicalSpecification?: string;
    physicalBatch?: string;
    reason?: string;
    evidence?: string[];
}
export declare class CorrectDiscrepancyDto {
    affectedQty: number;
    reason: string;
}
declare const AUTHORIZATION_RESOLUTIONS: string[];
declare const DIRECT_RESOLUTIONS: string[];
export declare class PurchaseReviewDto {
    purchaseStatus: string;
    remarks?: string;
}
export declare class QcReviewDto {
    qcStatus: string;
    remarks?: string;
}
export declare class RequestResolutionDto {
    resolution: string;
    reason: string;
}
export declare class DecideResolutionDto {
    action: string;
    comments?: string;
}
export declare class DirectResolveDto {
    resolution: string;
    reason: string;
}
export { AUTHORIZATION_RESOLUTIONS, DIRECT_RESOLUTIONS };
export declare class SegregateDiscrepancyDto {
    binId: string;
}
