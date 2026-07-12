import { PrismaService } from '../prisma/prisma.service';
export declare class PermissionsController {
    private prisma;
    constructor(prisma: PrismaService);
    private getPermissionsForRoleName;
    getMyPermissions(user: any): Promise<{
        role: any;
        permissions: string[];
        total: number;
    }>;
    getPermissionsForRole(role: string, user: any): Promise<{
        role: string;
        permissions: string[];
        total: number;
    }>;
    getAllPermissions(user: any): Promise<{
        rolePermissions: {
            role: string;
            permissions: string[];
            total: number;
        }[];
    }>;
}
