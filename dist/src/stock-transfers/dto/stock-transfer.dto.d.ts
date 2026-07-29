export declare class TransferItemDto {
    itemCode: string;
    itemName: string;
    uom: string;
    qty: number;
    unitCost: number;
    batchId?: string;
}
export declare class CreateTransferDto {
    transferType: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    fromBinId?: string;
    toBinId?: string;
    remarks?: string;
    items: TransferItemDto[];
}
