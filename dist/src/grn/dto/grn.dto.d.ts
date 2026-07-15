export declare class GrnItemDto {
    poItemId?: string;
    ipoItemId?: string;
    itemCode: string;
    itemName: string;
    uom: string;
    orderedQty: number;
    previouslyReceived: number;
    receivedQty: number;
    unitPrice: number;
    landedCostPerUnit?: number;
}
export declare class CreateGrnDto {
    grnType: string;
    poId?: string;
    ipoId?: string;
    gateInwardEntryId?: string;
    landedCostId?: string;
    warehouseId: string;
    receivedDate?: string;
    vehicleNumber?: string;
    dcNumber?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    remarks?: string;
    items: GrnItemDto[];
}
export declare class UpdateGrnDto {
    vehicleNumber?: string;
    dcNumber?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    remarks?: string;
}
