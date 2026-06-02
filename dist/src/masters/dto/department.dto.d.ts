export declare class CreateDepartmentDto {
    code: string;
    name: string;
    description?: string;
    headName?: string;
    companyId: string;
}
declare const UpdateDepartmentDto_base: import("@nestjs/common").Type<Partial<CreateDepartmentDto>>;
export declare class UpdateDepartmentDto extends UpdateDepartmentDto_base {
}
export {};
