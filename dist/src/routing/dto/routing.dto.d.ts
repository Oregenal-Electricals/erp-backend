export declare class RoutingStageDto {
    stageName: string;
    bomId: string;
    warehouseId?: string;
}
export declare class CreateRoutingDto {
    finalProductId: string;
    routingName: string;
    stages: RoutingStageDto[];
}
export declare class StartProductionDto {
    routingId: string;
    plannedQty: number;
    warehouseId: string;
}
