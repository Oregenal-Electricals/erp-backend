export declare class IssueItemDto {
    itemCode: string;
    itemName: string;
    uom: string;
    requestedQty: number;
}
export declare class CreateStockIssueDto {
    warehouseId: string;
    issuedTo: string;
    referenceType?: string;
    referenceId?: string;
    issueMethod?: string;
    remarks?: string;
    items: IssueItemDto[];
}
