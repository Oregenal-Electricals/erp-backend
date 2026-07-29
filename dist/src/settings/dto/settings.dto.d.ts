export declare class UpdateSystemSettingDto {
    value: string;
    description?: string;
}
export declare class BulkUpdateSettingsDto {
    settings: Record<string, string>;
}
export declare class CreateNumberingSeriesDto {
    companyId: string;
    documentType: string;
    prefix: string;
    separator?: string;
    includeYear?: boolean;
    yearFormat?: string;
    padding?: number;
}
declare const UpdateNumberingSeriesDto_base: import("@nestjs/common").Type<Partial<CreateNumberingSeriesDto>>;
export declare class UpdateNumberingSeriesDto extends UpdateNumberingSeriesDto_base {
}
export {};
