import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, user: any): Promise<{
        role: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        company: {
            id: string;
            name: string;
            code: string;
        };
        phone: string;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        additionalRoles: string[];
        mustChangePwd: boolean;
        isLocked: boolean;
    }>;
    findAllUsers(companyId?: string, role?: UserRole, isActive?: string, search?: string): Promise<{
        role: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        company: {
            id: string;
            name: string;
            code: string;
        };
        phone: string;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
    }[]>;
    changePwdInfo(): {
        message: string;
    };
    findOneUser(id: string): Promise<{
        role: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        company: {
            id: string;
            name: string;
            code: string;
        };
        phone: string;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
        role: string;
        id: string;
        isActive: boolean;
        company: {
            id: string;
            name: string;
        };
        phone: string;
        email: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
    }>;
    toggleUserStatus(id: string, user: any): Promise<{
        role: string;
        id: string;
        isActive: boolean;
        email: string;
        firstName: string;
        lastName: string;
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
