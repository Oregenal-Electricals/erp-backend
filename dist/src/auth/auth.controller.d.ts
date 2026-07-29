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
            role: string;
            additionalRoles: string[];
            allRoles: string[];
            companyId: string;
            company: {
                id: string;
                name: string;
                code: string;
            };
            mustChangePwd: boolean;
        };
    }>;
    me(user: any): Promise<{
        allRoles: string[];
        role: string;
        id: string;
        companyId: string;
        company: {
            id: string;
            name: string;
            code: string;
        };
        email: string;
        firstName: string;
        lastName: string;
        additionalRoles: string[];
        mustChangePwd: boolean;
        lastLoginAt: Date;
    }>;
}
