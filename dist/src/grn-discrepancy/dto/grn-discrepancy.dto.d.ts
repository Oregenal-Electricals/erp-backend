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
