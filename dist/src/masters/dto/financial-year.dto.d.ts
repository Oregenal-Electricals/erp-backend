export declare class CreateFinancialYearDto {
    code: string;
    label: string;
    startDate: string;
    endDate: string;
    companyId: string;
}
declare const UpdateFinancialYearDto_base: import("@nestjs/common").Type<Partial<CreateFinancialYearDto>>;
export declare class UpdateFinancialYearDto extends UpdateFinancialYearDto_base {
}
export {};
