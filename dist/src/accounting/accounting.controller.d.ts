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
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        nature: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    })[]>;
    createGroup(dto: CreateGroupDto, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        nature: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    updateGroup(id: string, dto: any, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        nature: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        parentGroupId: string | null;
        isSystemGroup: boolean;
    }>;
    getAccounts(req: any, query: any): Promise<{
        data: ({
            group: {
                code: string;
                name: string;
                type: string;
            };
        } & {
            id: string;
            companyId: string;
            code: string;
            name: string;
            groupId: string;
            type: string;
            nature: string;
            openingBalance: number;
            openingBalanceType: string;
            currentBalance: number;
            description: string | null;
            isBankAccount: boolean;
            isCashAccount: boolean;
            isSystemAccount: boolean;
            gstApplicable: boolean;
            taxRate: number | null;
            bankName: string | null;
            bankAccountNumber: string | null;
            bankIfscCode: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAccount(id: string, req: any): Promise<{
        group: {
            code: string;
            name: string;
            type: string;
            nature: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        groupId: string;
        type: string;
        nature: string;
        openingBalance: number;
        openingBalanceType: string;
        currentBalance: number;
        description: string | null;
        isBankAccount: boolean;
        isCashAccount: boolean;
        isSystemAccount: boolean;
        gstApplicable: boolean;
        taxRate: number | null;
        bankName: string | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    createAccount(dto: CreateAccountDto, req: any): Promise<{
        group: {
            code: string;
            name: string;
            type: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        groupId: string;
        type: string;
        nature: string;
        openingBalance: number;
        openingBalanceType: string;
        currentBalance: number;
        description: string | null;
        isBankAccount: boolean;
        isCashAccount: boolean;
        isSystemAccount: boolean;
        gstApplicable: boolean;
        taxRate: number | null;
        bankName: string | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    updateAccount(id: string, dto: any, req: any): Promise<{
        group: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        groupId: string;
        type: string;
        nature: string;
        openingBalance: number;
        openingBalanceType: string;
        currentBalance: number;
        description: string | null;
        isBankAccount: boolean;
        isCashAccount: boolean;
        isSystemAccount: boolean;
        gstApplicable: boolean;
        taxRate: number | null;
        bankName: string | null;
        bankAccountNumber: string | null;
        bankIfscCode: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
}
