import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, user: any): Promise<{
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        isActive: boolean;
        company: {
            id: string;
            code: string;
            name: string;
        };
        companyId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        mustChangePwd: boolean;
        isLocked: boolean;
    }>;
    findAllUsers(companyId?: string, role?: UserRole, isActive?: string, search?: string): Promise<{
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        isActive: boolean;
        company: {
            id: string;
            code: string;
            name: string;
        };
        companyId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
    }[]>;
    changePwdInfo(): {
        message: string;
    };
    findOneUser(id: string): Promise<{
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        isActive: boolean;
        company: {
            id: string;
            code: string;
            name: string;
        };
        companyId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
        id: string;
        phone: string;
        email: string;
        isActive: boolean;
        company: {
            id: string;
            name: string;
        };
        employeeCode: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    toggleUserStatus(id: string, user: any): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
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
