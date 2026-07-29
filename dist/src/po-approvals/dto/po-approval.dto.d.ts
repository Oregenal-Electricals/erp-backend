export declare class ApprovePoDto {
    remarks?: string;
}
export declare class RejectPoDto {
    remarks: string;
}
export declare class CreateApprovalSettingDto {
    level: number;
    levelName: string;
    minAmount?: number;
    maxAmount?: number;
}
export declare class UpdateApprovalSettingDto {
    levelName?: string;
    minAmount?: number;
    maxAmount?: number;
    isActive?: boolean;
}
