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
