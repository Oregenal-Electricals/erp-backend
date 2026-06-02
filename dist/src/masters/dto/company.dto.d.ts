export declare class CreateCompanyDto {
    code: string;
    name: string;
    legalName: string;
    pan?: string;
    tan?: string;
    cin?: string;
    gstin?: string;
    msmeNumber?: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    pincode: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    currencyCode?: string;
    timezone?: string;
}
declare const UpdateCompanyDto_base: import("@nestjs/common").Type<Partial<CreateCompanyDto>>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
}
export {};
