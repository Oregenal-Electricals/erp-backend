export declare class CreateDocumentDto {
    title: string;
    category?: string;
    fileType?: string;
    fileName: string;
    fileSize: number;
    fileData: string;
    mimeType: string;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    tags?: string;
    description?: string;
}
export declare class NewVersionDto extends CreateDocumentDto {
    parentDocId: string;
}
