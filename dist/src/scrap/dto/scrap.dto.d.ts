export declare class CreateScrapDto {
    workOrderId: string;
    sourceQcInspectionId: string;
    sourceReworkId?: string;
    quantity: number;
    defectDescription?: string;
    remarks?: string;
}
export declare class DispositionScrapDto {
    scrapQty: number;
    recoveryQty: number;
    otherDispositionQty?: number;
    estimatedScrapValue?: number;
    recognizedScrapRecovery?: number;
    recoveredComponents?: string;
    remarks?: string;
}
