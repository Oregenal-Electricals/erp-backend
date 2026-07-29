export declare class CreateNcrDto {
    source: string;
    sourceReferenceId?: string;
    sourceReferenceNumber?: string;
    itemCode?: string;
    itemName?: string;
    workOrderId?: string;
    description: string;
    severity: string;
    qtyAffected?: number;
    detectedBy?: string;
    detectedDate?: string;
    disposition?: string;
    remarks?: string;
}
export declare class UpdateNcrDto {
    disposition?: string;
    remarks?: string;
}
