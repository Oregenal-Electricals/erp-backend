import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
export declare class AccountsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    seedDefaultAccounts(companyId: string, userId: string): Promise<{
        message: string;
        count: number;
    }>;
    create(dto: CreateAccountDto, user: any): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        parentId: string | null;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
    }>;
    update(id: string, dto: UpdateAccountDto, user: any): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        parentId: string | null;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                children: number;
            };
            parent: {
                accountCode: string;
                accountName: string;
            };
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            currency: string;
            parentId: string | null;
            accountCode: string;
            accountName: string;
            accountType: string;
            accountSubType: string | null;
            openingBalance: number;
            isSystemAccount: boolean;
            currentBalance: number;
        })[];
        total: number;
    }>;
    getTree(user: any): Promise<any[]>;
    getStats(user: any): Promise<{
        total: number;
        assets: number;
        liabilities: number;
        equity: number;
        income: number;
        expense: number;
    }>;
    findOne(id: string, user: any): Promise<{
        parent: {
            accountCode: string;
            accountName: string;
        };
        children: {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            currency: string;
            parentId: string | null;
            accountCode: string;
            accountName: string;
            accountType: string;
            accountSubType: string | null;
            openingBalance: number;
            isSystemAccount: boolean;
            currentBalance: number;
        }[];
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        parentId: string | null;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
    }>;
}
