export declare class CreateHsnSacDto {
    code: string;
    codeType?: string;
    description: string;
    gstRate: number;
    cessRate?: number;
}
export declare class UpdateHsnSacDto {
    description?: string;
    codeType?: string;
    gstRate?: number;
    cessRate?: number;
    isActive?: boolean;
}
