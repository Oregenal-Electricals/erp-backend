export declare class RunPayrollDto {
    month: number;
    year: number;
    remarks?: string;
}
export declare class UpdatePayrollEntryDto {
    tdsAmount?: number;
    otherDeductions?: number;
    otherAllowances?: number;
    remarks?: string;
}
export declare class ApprovePayrollDto {
    action: string;
    remarks?: string;
}
