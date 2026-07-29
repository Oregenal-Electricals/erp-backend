export declare class PlanItemDto {
    soItemId: string;
    itemCode: string;
    itemName: string;
    plannedQty: number;
    uom?: string;
}
export declare class CreateDispatchPlanDto {
    soId: string;
    plannedDate: string;
    deliveryAddress?: string;
    transportMode?: string;
    transporterName?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    remarks?: string;
    items: PlanItemDto[];
}
export declare class CancelPlanDto {
    cancelReason: string;
}
