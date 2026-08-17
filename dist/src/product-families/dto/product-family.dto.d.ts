export declare class CreateProductFamilyDto {
    code: string;
    name: string;
    description?: string;
}
export declare class UpdateProductFamilyDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export declare class AssignProductsToFamilyDto {
    productIds: string[];
}
