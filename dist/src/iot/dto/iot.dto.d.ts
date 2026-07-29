export declare class CreateMachineDto {
    machineCode: string;
    machineName: string;
    machineType?: string;
    location?: string;
    manufacturer?: string;
    modelNumber?: string;
    ipAddress?: string;
    apiEndpoint?: string;
}
export declare class PostReadingDto {
    machineId: string;
    readingType: string;
    value: number;
    unit?: string;
}
export declare class BulkReadingDto {
    machineId: string;
    readings: {
        readingType: string;
        value: number;
        unit?: string;
    }[];
}
export declare class UpdateAlertDto {
    status: string;
}
