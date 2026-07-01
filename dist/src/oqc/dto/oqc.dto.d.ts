export declare class CreateOqcDto {
    fgReceiptId?: string;
    workOrderId?: string;
    itemCode: string;
    itemName: string;
    uom?: string;
    customerName?: string;
    lotNumber?: string;
    batchNumber?: string;
    inspectorName?: string;
    inspectionDate?: string;
    sampleSize: number;
    passQty: number;
    failQty: number;
    visualCheck?: string;
    dimensionalCheck?: string;
    functionalCheck?: string;
    packagingCheck?: string;
    labellingCheck?: string;
    result?: string;
    defectsFound?: string;
    cocNumber?: string;
    remarks?: string;
}
export declare class CompleteOqcDto {
    result: string;
    defectsFound?: string;
    cocNumber?: string;
    remarks?: string;
}
