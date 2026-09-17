export declare class CreateVerificationDto {
    pickListId: string;
}
export declare class VerifyItemDto {
    pickListItemId: string;
    verifiedQty: number;
}
export declare class ReverseVerificationDto {
    reverseQty: number;
    reason?: string;
}
