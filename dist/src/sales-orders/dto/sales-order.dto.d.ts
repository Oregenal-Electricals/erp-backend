export declare class SoItemDto {
    cpoItemId?: string;
    itemCode: string;
    itemName: string;
    description?: string;
    qty: number;
    uom?: string;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
    saleType?: string;
    requiredStageId?: string;
}
export declare class CreateSoDto {
    cpoId: string;
    deliveryDate: string;
    remarks?: string;
    items: SoItemDto[];
}
export declare class CancelSoDto {
    cancelReason: string;
}
