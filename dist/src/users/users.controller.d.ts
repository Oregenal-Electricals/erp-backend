import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        isActive: boolean;
        role: string;
        companyId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        additionalRoles: string[];
        mustChangePwd: boolean;
        isLocked: boolean;
    }>;
    findAllUsers(companyId?: string, role?: UserRole, isActive?: string, search?: string): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        isActive: boolean;
        role: string;
        companyId: string;
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
        company: {
            id: string;
            code: string;
            name: string;
        };
        id: string;
        phone: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        isActive: boolean;
        role: string;
        companyId: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
        company: {
            id: string;
            name: string;
        };
        id: string;
        phone: string;
        email: string;
        isActive: boolean;
        role: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
    }>;
    toggleUserStatus(id: string, user: any): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        role: string;
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
