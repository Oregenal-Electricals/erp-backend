import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, user: any): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        company: {
            id: string;
            code: string;
            name: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        isLocked: boolean;
        employeeCode: string;
        additionalRoles: import(".prisma/client").$Enums.UserRole[];
        mustChangePwd: boolean;
    }>;
    findAllUsers(companyId?: string, role?: UserRole, isActive?: string, search?: string): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        company: {
            id: string;
            code: string;
            name: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        isLocked: boolean;
        employeeCode: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
    }[]>;
    changePwdInfo(): {
        message: string;
    };
    findOneUser(id: string): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        company: {
            id: string;
            code: string;
            name: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        isLocked: boolean;
        employeeCode: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        loginAttempts: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        company: {
            id: string;
            name: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        employeeCode: string;
    }>;
    toggleUserStatus(id: string, user: any): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        firstName: string;
        lastName: string;
        email: string;
    }>;
    unlockUser(id: string, user: any): Promise<{
        id: string;
        email: string;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    resetPassword(id: string, dto: ResetPasswordDto, user: any): Promise<{
        message: string;
    }>;
    changePassword(dto: ChangePasswordDto, user: any): Promise<{
        message: string;
    }>;
}
