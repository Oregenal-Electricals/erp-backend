import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, user: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        isActive: boolean;
        company: {
            id: string;
            name: string;
            code: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        employeeCode: string;
        additionalRoles: string[];
        mustChangePwd: boolean;
        isLocked: boolean;
    }>;
    findAllUsers(companyId?: string, role?: UserRole, isActive?: string, search?: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        isActive: boolean;
        company: {
            id: string;
            name: string;
            code: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        employeeCode: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
    }[]>;
    changePwdInfo(): {
        message: string;
    };
    findOneUser(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        isActive: boolean;
        company: {
            id: string;
            name: string;
            code: string;
        };
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        employeeCode: string;
        assignedStage: string;
        mustChangePwd: boolean;
        lastLoginAt: Date;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: any): Promise<{
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
        role: string;
        employeeCode: string;
        assignedStage: string;
    }>;
    toggleUserStatus(id: string, user: any): Promise<{
        id: string;
        isActive: boolean;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
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
