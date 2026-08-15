export declare class SyncElementDto {
    key: string;
    elementType: string;
    module: string;
    page?: string;
    label: string;
    icon?: string;
    parentKey?: string;
    sortOrder?: number;
    defaultVisible?: boolean;
}
export declare class SyncElementsDto {
    elements: SyncElementDto[];
}
export declare class CreateElementDto extends SyncElementDto {
}
export declare class UpdateElementDto {
    label?: string;
    page?: string;
    icon?: string;
    parentKey?: string;
    sortOrder?: number;
    defaultVisible?: boolean;
}
export declare class ReorderItemDto {
    id: string;
    parentKey?: string;
    sortOrder: number;
}
export declare class ReorderElementsDto {
    items: ReorderItemDto[];
}
export declare class UpsertOverrideDto {
    elementId: string;
    scopeType: 'ROLE' | 'USER';
    roleName?: string;
    userId?: string;
    isVisible: boolean;
    customLabel?: string;
    parentKeyOverride?: string;
    sortOrderOverride?: number;
}
export declare class BulkUpsertOverridesDto {
    overrides: UpsertOverrideDto[];
}
