import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        timestamp: string;
        environment: string;
        version: string;
        services: {
            api: {
                status: string;
                uptime: number;
            };
            database: {
                status: string;
                provider: string;
            };
        };
        system: {
            platform: NodeJS.Platform;
            nodeVersion: string;
            memoryUsage: {
                used: number;
                total: number;
                unit: string;
            };
        };
    }>;
    ping(): {
        status: string;
        message: string;
        timestamp: string;
    };
    dbCheck(): Promise<{
        status: string;
        database: string;
        connected: boolean;
        timestamp: string;
    }>;
}
