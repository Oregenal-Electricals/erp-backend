import { PrismaService } from '../prisma/prisma.service';
export declare class DummyDataService {
    private prisma;
    constructor(prisma: PrismaService);
    getStatus(companyId?: string): Promise<{
        companies: number;
        plants: number;
        units: number;
        departments: number;
        branches: number;
        financialYears: number;
        users: number;
        changeRequests: number;
        total: number;
    }>;
    seedCompany(companyId: string, userId: string): Promise<{
        message: string;
        company: string;
        created: {
            plants: number;
            units: number;
            departments: number;
            branches: number;
            financialYears: number;
            users: number;
            changeRequests: number;
        };
        note: string;
    }>;
    purgeCompany(companyId: string): Promise<{
        message: string;
        company: string;
        deleted: {
            changeRequestComments: number;
            changeRequests: number;
            users: number;
            financialYears: number;
            branches: number;
            departments: number;
            units: number;
            plants: number;
        };
    }>;
    purgeAll(): Promise<{
        message: string;
        deleted: {
            changeRequests: number;
            users: number;
            financialYears: number;
            branches: number;
            departments: number;
            units: number;
            plants: number;
            companies: number;
        };
        warning: string;
    }>;
    getTestSessionSummary(companyId?: string): Promise<{
        total: number;
        byTable: Record<string, number>;
    }>;
    purgeTestSessionData(companyId?: string): Promise<{
        message: string;
        deleted: Record<string, number>;
        totalDeleted: number;
        blockedTables: string[];
        note: string;
    }>;
    getFullWipePreview(companyId?: string): Promise<{
        safeToProceed: boolean;
        unmatchedKeepNames: string[];
        keptTables: Record<string, number>;
        tablesToWipe: Record<string, number>;
        totalTablesAffected: number;
        totalRowsToWipe: number;
        note: string;
    }>;
    fullWipeExceptMasterData(confirmationPhrase: string, user: any, companyId?: string): Promise<{
        message: string;
        deleted: Record<string, number>;
        totalDeleted: number;
        blockedTables: string[];
        note: string;
        keptTables: string[];
    }>;
}
