import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
        companyId: string;
        previewMode?: boolean;
    }): Promise<{
        previewMode: boolean;
        role: string;
        id: string;
        companyId: string;
        isActive: boolean;
        email: string;
        firstName: string;
        lastName: string;
        assignedStage: string;
        isLocked: boolean;
        isTestUser: boolean;
    }>;
}
export {};
