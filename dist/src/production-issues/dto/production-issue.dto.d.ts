export declare class ProductionIssueItemDto {
    itemCode: string;
    itemName: string;
    uom: string;
    requiredQty: number;
    issuedQty: number;
    batchId?: string;
    unitCost: number;
}
export declare class CreateProductionIssueDto {
    workOrderId: string;
    warehouseId: string;
    issueMethod?: string;
    remarks?: string;
    items: ProductionIssueItemDto[];
}
