export declare class CreateRoleDto {
    name: string;
    label: string;
    description?: string;
    permissions: string[];
}
export declare class UpdateRolePermissionsDto {
    permissions: string[];
}
export declare class UpdateRoleDto {
    label?: string;
    description?: string;
    isActive?: boolean;
}
