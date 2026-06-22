export declare class PrItemDto {
    sequence?: number;
    itemType?: string;
    rawMaterialId?: string;
    itemCode: string;
    itemName: string;
    description?: string;
    uom: string;
    requiredQty: number;
    estimatedUnitPrice?: number;
    hsnCode?: string;
    notes?: string;
}
export declare class CreatePurchaseRequisitionDto {
    title: string;
    description?: string;
    requiredDate: string;
    department?: string;
    priority?: string;
    notes?: string;
    items?: PrItemDto[];
}
export declare class UpdatePurchaseRequisitionDto {
    title?: string;
    description?: string;
    requiredDate?: string;
    department?: string;
    priority?: string;
    notes?: string;
}
export declare class RejectPrDto {
    rejectionReason: string;
}
