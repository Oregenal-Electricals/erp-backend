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
            role: string;
            additionalRoles: string[];
            allRoles: string[];
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
        allRoles: string[];
        company: {
            id: string;
            code: string;
            name: string;
        };
        id: string;
        email: string;
        role: string;
        companyId: string;
        firstName: string;
        lastName: string;
        additionalRoles: string[];
        mustChangePwd: boolean;
        lastLoginAt: Date;
    }>;
}
