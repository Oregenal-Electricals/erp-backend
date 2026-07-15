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
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        nature: string;
        isSystemGroup: boolean;
        parentGroupId: string | null;
    }>;
    updateGroup(id: string, dto: any, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        nature: string;
        isSystemGroup: boolean;
        parentGroupId: string | null;
    }>;
    findAllGroups(user: any): Promise<({
        _count: {
            accounts: number;
            childGroups: number;
        };
        parentGroup: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        nature: string;
        isSystemGroup: boolean;
        parentGroupId: string | null;
    })[]>;
    createAccount(dto: CreateAccountDto, user: any): Promise<{
        group: {
            name: string;
            code: string;
            type: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        gstApplicable: boolean;
        isBankAccount: boolean;
        isCashAccount: boolean;
        nature: string;
        openingBalanceType: string;
        groupId: string;
    }>;
    updateAccount(id: string, dto: any, user: any): Promise<{
        group: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        gstApplicable: boolean;
        isBankAccount: boolean;
        isCashAccount: boolean;
        nature: string;
        openingBalanceType: string;
        groupId: string;
    }>;
    findAllAccounts(user: any, query: any): Promise<{
        data: ({
            group: {
                name: string;
                code: string;
                type: string;
            };
        } & {
            id: string;
            companyId: string;
            name: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            code: string;
            type: string;
            bankName: string | null;
            taxRate: number | null;
            isSystemAccount: boolean;
            openingBalance: number;
            currentBalance: number;
            bankAccountNumber: string | null;
            bankIfscCode: string | null;
            gstApplicable: boolean;
            isBankAccount: boolean;
            isCashAccount: boolean;
            nature: string;
            openingBalanceType: string;
            groupId: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAccount(id: string, user: any): Promise<{
        group: {
            name: string;
            code: string;
            type: string;
            nature: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        type: string;
        bankName: string | null;
        taxRate: number | null;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        gstApplicable: boolean;
        isBankAccount: boolean;
        isCashAccount: boolean;
        nature: string;
        openingBalanceType: string;
        groupId: string;
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
