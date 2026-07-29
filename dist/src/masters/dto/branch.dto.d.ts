export declare class CreateBranchDto {
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
    branchType?: string;
    companyId: string;
}
declare const UpdateBranchDto_base: import("@nestjs/common").Type<Partial<CreateBranchDto>>;
export declare class UpdateBranchDto extends UpdateBranchDto_base {
}
export {};
