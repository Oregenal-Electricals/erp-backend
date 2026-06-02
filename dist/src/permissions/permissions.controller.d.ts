import { UserRole } from '@prisma/client';
import { Permission } from '../common/permissions/permissions.enum';
export declare class PermissionsController {
    getMyPermissions(user: any): {
        role: any;
        permissions: Permission[];
        total: number;
    };
    getPermissionsForRole(role: UserRole): {
        role: import(".prisma/client").$Enums.UserRole;
        permissions: Permission[];
        total: number;
    };
    getAllPermissions(): {
        permissions: Permission[];
        rolePermissions: {
            role: string;
            permissions: Permission[];
            total: number;
        }[];
    };
}
