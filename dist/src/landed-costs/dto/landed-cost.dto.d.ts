export declare class CreateLandedCostDto {
    ipoId: string;
    invoiceValue?: number;
    customsDuty?: number;
    freightCharges?: number;
    chaCharges?: number;
    portCharges?: number;
    bankCharges?: number;
    insuranceCharges?: number;
    otherCharges?: number;
    allocationMethod?: string;
    notes?: string;
}
export declare class UpdateLandedCostDto {
    invoiceValue?: number;
    customsDuty?: number;
    freightCharges?: number;
    chaCharges?: number;
    portCharges?: number;
    bankCharges?: number;
    insuranceCharges?: number;
    otherCharges?: number;
    allocationMethod?: string;
    notes?: string;
}
