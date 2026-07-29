export declare class CreateBatchDto {
    itemCode: string;
    itemName: string;
    uom?: string;
    warehouseId: string;
    lotNumber?: string;
    grnId?: string;
    grnItemId?: string;
    mfgDate?: string;
    expiryDate?: string;
    receivedDate?: string;
    originalQty: number;
    unitCost: number;
    remarks?: string;
}
export declare class UpdateBatchDto {
    lotNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    remarks?: string;
}
