import { AccountingService } from './accounting.service';
import { CreateGroupDto, CreateAccountDto } from './dto/accounting.dto';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    getStats(req: any): Promise<{
        totalGroups: number;
        totalAccounts: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.AccountHeadGroupByOutputType, "type"[]> & {
            _count: {
                id: number;
            };
        })[];
        isSeeded: boolean;
    }>;
    seedCoa(req: any): Promise<{
        message: string;
        groups: number;
        accounts?: undefined;
    } | {
        message: string;
        groups: number;
        accounts: number;
    }>;
    getGroups(req: any): Promise<({
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    })[]>;
    createGroup(dto: CreateGroupDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    updateGroup(id: string, dto: any, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        type: string;
        nature: string;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    getAccounts(req: any, query: any): Promise<{
        data: ({
            group: {
                name: string;
                code: string;
                type: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            name: string;
            description: string | null;
            code: string;
            isSystemAccount: boolean;
            openingBalance: number;
            currentBalance: number;
            bankName: string | null;
            type: string;
            taxRate: number | null;
            bankAccountNumber: string | null;
            bankIfscCode: string | null;
            groupId: string;
            nature: string;
            openingBalanceType: string;
            isBankAccount: boolean;
            isCashAccount: boolean;
            gstApplicable: boolean;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAccount(id: string, req: any): Promise<{
        group: {
            name: string;
            code: string;
            type: string;
            nature: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankName: string | null;
        type: string;
        taxRate: number | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        groupId: string;
        nature: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
    createAccount(dto: CreateAccountDto, req: any): Promise<{
        group: {
            name: string;
            code: string;
            type: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankName: string | null;
        type: string;
        taxRate: number | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        groupId: string;
        nature: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
    updateAccount(id: string, dto: any, req: any): Promise<{
        group: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        isSystemAccount: boolean;
        openingBalance: number;
        currentBalance: number;
        bankName: string | null;
        type: string;
        taxRate: number | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        groupId: string;
        nature: string;
        openingBalanceType: string;
        isBankAccount: boolean;
        isCashAccount: boolean;
        gstApplicable: boolean;
    }>;
}
