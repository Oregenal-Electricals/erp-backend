export declare class IqcItemUpdateDto {
    id: string;
    acceptedQty: number;
    rejectedQty: number;
    rejectionReason?: string;
    holdQty?: number;
    holdReason?: string;
}
export declare class HandoverLineDto {
    grnItemId: string;
    qty: number;
}
export declare class CreateIqcDto {
    grnId: string;
    inspectedBy?: string;
    remarks?: string;
    items?: HandoverLineDto[];
}
export declare class UpdateIqcItemsDto {
    items: IqcItemUpdateDto[];
}
export declare class ConfirmReceiptItemDto {
    itemId: string;
    confirmedQty: number;
}
export declare class ConfirmReceiptDto {
    items: ConfirmReceiptItemDto[];
}
export declare class AttachTemplateDto {
    templateId: string;
    sampleSize?: number;
}
export declare class IqcCheckParameterDto {
    id?: string;
    sNo: number;
    category: string;
    parameterName: string;
    specification: string;
    sortOrder?: number;
}
export declare class CreateIqcCheckTemplateDto {
    rawMaterialId?: string;
    name: string;
    docCode?: string;
    revision?: string;
    parameters: IqcCheckParameterDto[];
}
export declare class UpdateIqcCheckTemplateDto {
    name?: string;
    docCode?: string;
    revision?: string;
    parameters?: IqcCheckParameterDto[];
}
export declare class IqcParameterResultDto {
    parameterId: string;
    s1?: string;
    s2?: string;
    s3?: string;
    s4?: string;
    s5?: string;
    remark?: string;
}
export declare class SubmitIqcStageResultDto {
    outcome: string;
    remarks: string;
    acceptedQty?: number;
    rejectedQty?: number;
    rejectionReason?: string;
    parameterResults?: IqcParameterResultDto[];
}
export declare class ImportedTemplateParameterDto {
    sNo: number;
    category: string;
    parameterName: string;
    specification: string;
}
export declare class ImportedTemplateDto {
    sheetName: string;
    name: string;
    docCode?: string;
    parameters: ImportedTemplateParameterDto[];
    error?: string;
}
export declare class ConfirmTemplateImportDto {
    templates: ImportedTemplateDto[];
}
