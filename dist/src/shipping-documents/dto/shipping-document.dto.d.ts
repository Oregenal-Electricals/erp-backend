export declare class CreateShippingDocumentDto {
    shipmentId: string;
    ipoId: string;
    documentType: string;
    documentNumber: string;
    issueDate?: string;
    placeOfIssue?: string;
    shipperName?: string;
    consigneeName?: string;
    notifyParty?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    descriptionOfGoods?: string;
    freightTerms?: string;
    numberOfOriginals?: number;
    originalsReceived?: number;
    notes?: string;
}
export declare class UpdateShippingDocumentDto {
    shipperName?: string;
    consigneeName?: string;
    notifyParty?: string;
    descriptionOfGoods?: string;
    numberOfOriginals?: number;
    originalsReceived?: number;
    notes?: string;
}
