export declare class CreateReworkDto {
    workOrderId: string;
    originalQcInspectionId: string;
    quantity: number;
    defectDescription?: string;
    reworkStage?: string;
    remarks?: string;
}
export declare class StartReworkDto {
    manpowerQty: number;
}
export declare class CompleteReworkDto {
    successfullyReworkedQty: number;
    stillDefectiveQty: number;
    additionalMaterialCost?: number;
    additionalOtherCost?: number;
    remarks?: string;
}
