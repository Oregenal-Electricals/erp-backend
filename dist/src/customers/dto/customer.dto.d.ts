export declare class CustomerAddressDto {
    id?: string;
    addressType?: string;
    addressLine: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
}
export declare class CustomerContactDto {
    id?: string;
    name: string;
    designation?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
}
export declare class CustomerGstDto {
    id?: string;
    gstNumber: string;
    branchLabel?: string;
}
export declare class CreateCustomerDto {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    addresses?: CustomerAddressDto[];
    contacts?: CustomerContactDto[];
    gstNumbers?: CustomerGstDto[];
}
export declare class UpdateCustomerDto extends CreateCustomerDto {
}
