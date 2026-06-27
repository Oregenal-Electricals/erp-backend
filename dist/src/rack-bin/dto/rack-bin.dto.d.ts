export declare class CreateZoneDto {
    warehouseId: string;
    code: string;
    name: string;
    description?: string;
}
export declare class CreateRackDto {
    warehouseId: string;
    zoneId?: string;
    code: string;
    name: string;
    totalBins?: number;
    description?: string;
}
export declare class CreateBinDto {
    warehouseId: string;
    rackId: string;
    code: string;
    name?: string;
    maxQty?: number;
    maxWeight?: number;
}
export declare class BulkCreateBinsDto {
    warehouseId: string;
    rackId: string;
    count: number;
    prefix: string;
    maxQty?: number;
}
export declare class UpdateBinStatusDto {
    status: string;
    itemCode?: string;
    currentQty?: number;
}
