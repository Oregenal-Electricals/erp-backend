import { GatePassType } from '@prisma/client';
export declare class CreateGatePassDto {
    plantId: string;
    type: GatePassType;
    purpose: string;
    carrierName: string;
    carrierMobile?: string;
    carrierIdProof?: string;
    vehicleNumber?: string;
    itemDescription: string;
    quantity: number;
    unit?: string;
    estimatedValue?: number;
    validFrom?: string;
    validTo?: string;
    remarks?: string;
}
export declare class ApproveGatePassDto {
    remarks?: string;
}
export declare class CancelGatePassDto {
    cancelReason: string;
}
export declare class ReturnGatePassDto {
    remarks?: string;
}
