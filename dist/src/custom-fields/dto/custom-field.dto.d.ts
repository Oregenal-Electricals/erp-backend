export declare class CreateCustomFieldDefinitionDto {
    module: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType?: string;
    options?: string[];
    placeholder?: string;
    defaultValue?: string;
    isRequired?: boolean;
    sortOrder?: number;
}
export declare class UpdateCustomFieldDefinitionDto {
    fieldLabel?: string;
    fieldType?: string;
    options?: string[];
    placeholder?: string;
    defaultValue?: string;
    isRequired?: boolean;
    isActive?: boolean;
    sortOrder?: number;
}
export declare class SaveCustomFieldValuesDto {
    values: Record<string, string>;
}
