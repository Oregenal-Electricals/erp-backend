import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(req: any): Promise<{
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
    findOne(id: string, req: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    create(dto: CreateRoleDto, req: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    update(id: string, dto: UpdateRoleDto, req: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    updatePermissions(id: string, dto: UpdateRolePermissionsDto, req: any): Promise<{
        id: string;
        name: string;
        label: string;
        description: string;
        isSystemRole: boolean;
        isProtected: boolean;
        permissions: string[];
        userCount: number;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
