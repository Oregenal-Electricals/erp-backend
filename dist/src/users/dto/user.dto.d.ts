import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    employeeCode?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
    companyId: string;
    mustChangePwd?: boolean;
}
export declare class UpdateUserDto {
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
}
export declare class ResetPasswordDto {
    newPassword: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
