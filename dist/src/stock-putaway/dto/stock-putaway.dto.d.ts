export declare class PutawayItemDto {
    binId: string;
    itemCode: string;
    itemName: string;
    uom: string;
    qty: number;
    unitCost: number;
}
export declare class CreatePutawayDto {
    grnId: string;
    iqcId?: string;
    warehouseId: string;
    remarks?: string;
    items?: PutawayItemDto[];
}
export declare class UpdatePutawayItemsDto {
    items: PutawayItemDto[];
}
