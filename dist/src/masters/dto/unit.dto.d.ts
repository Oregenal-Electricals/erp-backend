export declare class CreateUnitDto {
    code: string;
    name: string;
    description?: string;
    unitType?: string;
    plantId: string;
}
declare const UpdateUnitDto_base: import("@nestjs/common").Type<Partial<CreateUnitDto>>;
export declare class UpdateUnitDto extends UpdateUnitDto_base {
}
export {};
