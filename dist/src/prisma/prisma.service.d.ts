import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    private installTestDataAutoTagging;
    private wrapClient;
    private installTransactionAutoTagging;
    onModuleDestroy(): Promise<void>;
    healthCheck(): Promise<boolean>;
    cleanDatabase(): Promise<void>;
}
