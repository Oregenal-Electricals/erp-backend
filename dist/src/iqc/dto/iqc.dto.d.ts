export declare class IqcItemUpdateDto {
    id: string;
    acceptedQty: number;
    rejectedQty: number;
    rejectionReason?: string;
}
export declare class CreateIqcDto {
    grnId: string;
    inspectedBy?: string;
    remarks?: string;
}
export declare class UpdateIqcItemsDto {
    items: IqcItemUpdateDto[];
}
