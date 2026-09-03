export declare class CreateWorkOrderDto {
    productCode: string;
    productName: string;
    uom?: string;
    bomId?: string;
    warehouseId: string;
    plannedQty: number;
    plannedStartDate: string;
    plannedEndDate: string;
    requiredDate?: string;
    salesOrderId?: string;
    plannedManpower?: number;
    priority?: string;
    remarks?: string;
}
export declare class UpdateWorkOrderDto {
    status?: string;
    completedQty?: number;
    rejectedQty?: number;
    actualStartDate?: string;
    actualEndDate?: string;
    requiredDate?: string;
    plannedManpower?: number;
    priority?: string;
    remarks?: string;
}
export declare class CompleteStageDto {
    shortClosure?: boolean;
    reason?: string;
}
