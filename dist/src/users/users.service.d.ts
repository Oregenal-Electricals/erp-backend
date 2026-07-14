import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createUser(dto: CreateUserDto, requestingUser: any): Promise<{
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
    findAllUsers(filters: {
        companyId?: string;
        role?: UserRole;
        isActive?: boolean;
        search?: string;
    }): Promise<{
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
    updateUser(id: string, dto: UpdateUserDto, requestingUser: any): Promise<{
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
    toggleUserStatus(id: string, requestingUser: any): Promise<{
        role: string;
        id: string;
        isActive: boolean;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    unlockUser(id: string, requestingUser: any): Promise<{
        id: string;
        email: string;
        isLocked: boolean;
        loginAttempts: number;
    }>;
    resetPassword(id: string, dto: ResetPasswordDto, requestingUser: any): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
