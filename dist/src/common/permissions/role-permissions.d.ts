import { UserRole } from '@prisma/client';
import { Permission } from './permissions.enum';
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare function roleHasPermission(role: UserRole, permission: Permission): boolean;
export declare function getPermissionsForRole(role: UserRole): Permission[];
