import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            allRoles: import("@prisma/client").$Enums.UserRole[];
            companyId: string;
            company: {
                id: string;
                code: string;
                name: string;
            };
            mustChangePwd: boolean;
        };
    }>;
    me(user: any): Promise<{
        allRoles: import("@prisma/client").$Enums.UserRole[];
        id: string;
        email: string;
        company: {
            id: string;
            code: string;
            name: string;
        };
        companyId: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
        additionalRoles: import("@prisma/client").$Enums.UserRole[];
        mustChangePwd: boolean;
        lastLoginAt: Date;
    }>;
}
