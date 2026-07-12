import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRoleDto, UpdateRolePermissionsDto, UpdateRoleDto } from './dto/role.dto';
export declare class RolesService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    findAll(user: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissionCount: number;
        permissions: string[];
        userCount: number;
    }[]>;
    findOne(id: string, user: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    create(dto: CreateRoleDto, user: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    update(id: string, dto: UpdateRoleDto, user: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    updatePermissions(id: string, dto: UpdateRolePermissionsDto, user: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    private assertEditable;
}
