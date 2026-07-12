import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(dto: LoginDto, ip?: string): Promise<{
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
    me(userId: string): Promise<{
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
