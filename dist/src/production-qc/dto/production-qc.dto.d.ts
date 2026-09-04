export declare class CreateProductionQcDto {
    workOrderId: string;
    productionEntryId?: string;
    inspectionStage?: string;
    inspectorName?: string;
    inspectionDate?: string;
    sampleSize: number;
    passQty: number;
    failQty: number;
    defectDescription?: string;
    correctiveAction?: string;
    remarks?: string;
}
export declare class CompleteQcDto {
    result: string;
    defectDescription?: string;
    correctiveAction?: string;
    remarks?: string;
}
export declare class DecideQcDto {
    acceptedQty: number;
    reworkQty: number;
    rejectedQty: number;
    holdQty?: number;
    defectDescription?: string;
    remarks?: string;
}
