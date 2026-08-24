export declare class CreateGateEventDto {
    plantId: string;
    gateId?: string;
    eventType: string;
    referenceType?: string;
    referenceId?: string;
    personId?: string;
    personName?: string;
    vehicleId?: string;
    vehicleNumber?: string;
    eventTime?: string;
    source?: string;
    remarks?: string;
}
export declare class CorrectGateEventDto {
    eventType: string;
    referenceType?: string;
    referenceId?: string;
    personId?: string;
    personName?: string;
    vehicleId?: string;
    vehicleNumber?: string;
    remarks: string;
}
