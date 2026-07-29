export declare class CreateProductRevisionDto {
    productId: string;
    revisionNumber: string;
    changeDescription: string;
    changeType?: string;
    previousRevision?: string;
    drawingNumber?: string;
    specifications?: Record<string, any>;
    effectiveDate?: string;
}
export declare class UpdateProductRevisionDto {
    changeDescription?: string;
    changeType?: string;
    drawingNumber?: string;
    specifications?: Record<string, any>;
    effectiveDate?: string;
}
