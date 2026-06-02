export declare class CreatePlantDto {
    code: string;
    name: string;
    gstin?: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    phone?: string;
    email?: string;
    plantType?: string;
    companyId: string;
}
declare const UpdatePlantDto_base: import("@nestjs/common").Type<Partial<CreatePlantDto>>;
export declare class UpdatePlantDto extends UpdatePlantDto_base {
}
export {};
