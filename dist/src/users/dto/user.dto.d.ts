export declare class CreateUserDto {
    employeeCode?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    additionalRoles?: string[];
    companyId: string;
    mustChangePwd?: boolean;
}
export declare class UpdateUserDto {
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
}
export declare class ResetPasswordDto {
    newPassword: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
