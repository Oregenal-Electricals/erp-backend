export declare class CreatePackingDto {
    verificationId: string;
}
export declare class CreatePackageDto {
    packageType?: string;
    netWeight?: number;
    grossWeight?: number;
}
export declare class AddPackageItemDto {
    verificationItemId: string;
    packedQty: number;
}
export declare class ReversePackageItemDto {
    reverseQty: number;
    reason?: string;
}
