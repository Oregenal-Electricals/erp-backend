import { PrismaService } from '../../prisma/prisma.service';
export interface AuditParams {
    tableName: string;
    recordId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'ACTIVATE' | 'DEACTIVATE';
    oldValues?: any;
    newValues?: any;
    changedBy: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
}
export declare class AuditService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(params: AuditParams): Promise<void>;
}
