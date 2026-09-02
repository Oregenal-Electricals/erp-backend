export declare class CreateProductionEntryDto {
    workOrderId: string;
    entryDate?: string;
    shift?: string;
    operatorName?: string;
    machineName?: string;
    goodQty: number;
    scrapQty?: number;
    reworkQty?: number;
    manpowerQty?: number;
    periodStart: string;
    periodEnd: string;
    downtimeMinutes?: number;
    downtimeReason?: string;
    remarks?: string;
}
