import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGroupDto, CreateAccountDto } from './dto/accounting.dto';
export declare class AccountingService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    seedDefaultCoa(companyId: string, userId: string): Promise<{
        message: string;
        groups: number;
        accounts?: undefined;
    } | {
        message: string;
        groups: number;
        accounts: number;
    }>;
    createGroup(dto: CreateGroupDto, user: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    updateGroup(id: string, dto: any, user: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    findAllGroups(user: any): Promise<({
        _count: {
            accounts: number;
            childGroups: number;
        };
        parentGroup: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    })[]>;
    createAccount(dto: CreateAccountDto, user: any): Promise<{
        group: {
            code: string;
            name: string;
            type: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        nature: string;
        groupId: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
    updateAccount(id: string, dto: any, user: any): Promise<{
        group: {
            name: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        nature: string;
        groupId: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
    findAllAccounts(user: any, query: any): Promise<{
        data: ({
            group: {
                code: string;
                name: string;
                type: string;
            };
        } & {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string | null;
            type: string;
            bankName: string | null;
            taxRate: number | null;
            openingBalance: number;
            isSystemAccount: boolean;
            currentBalance: number;
            bankAccountNumber: string | null;
            bankIfscCode: string | null;
            nature: string;
            groupId: string;
            openingBalanceType: string;
            isBankAccount: boolean;
            isCashAccount: boolean;
            gstApplicable: boolean;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAccount(id: string, user: any): Promise<{
        group: {
            code: string;
            name: string;
            type: string;
            nature: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        openingBalance: number;
        isSystemAccount: boolean;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        nature: string;
        groupId: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
    getStats(user: any): Promise<{
        totalGroups: number;
        totalAccounts: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.AccountHeadGroupByOutputType, "type"[]> & {
            _count: {
                id: number;
            };
        })[];
        isSeeded: boolean;
    }>;
}
