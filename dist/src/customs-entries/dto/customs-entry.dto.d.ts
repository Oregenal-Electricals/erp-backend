export declare class CreateCustomsEntryDto {
    ipoId: string;
    shipmentId: string;
    customsBoeNumber?: string;
    chaName?: string;
    portOfEntry?: string;
    cifValue: number;
    bcdRate?: number;
    igstRate?: number;
    aidcAmount?: number;
    notes?: string;
}
export declare class UpdateCustomsEntryDto {
    customsBoeNumber?: string;
    chaName?: string;
    portOfEntry?: string;
    cifValue?: number;
    bcdRate?: number;
    igstRate?: number;
    aidcAmount?: number;
    notes?: string;
}
export declare class AssessCustomsEntryDto {
    cifValue: number;
    bcdRate: number;
    igstRate: number;
    aidcAmount?: number;
    customsBoeNumber?: string;
}
