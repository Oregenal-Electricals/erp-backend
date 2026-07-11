import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getStats(req: any): Promise<{
        total: number;
        assets: number;
        liabilities: number;
        equity: number;
        income: number;
        expense: number;
    }>;
    getTree(req: any): Promise<any[]>;
    seed(req: any): Promise<{
        message: string;
        count: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
            openingBalance: number;
            currentBalance: number;
            description: string | null;
            isSystemAccount: boolean;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            currency: string;
            accountCode: string;
            accountName: string;
            accountType: string;
            accountSubType: string | null;
            parentId: string | null;
        })[];
        total: number;
    }>;
    findOne(id: string, req: any): Promise<{
        parent: {
            accountCode: string;
            accountName: string;
        };
        children: {
            id: string;
            companyId: string;
            openingBalance: number;
            currentBalance: number;
            description: string | null;
            isSystemAccount: boolean;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            currency: string;
            accountCode: string;
            accountName: string;
            accountType: string;
            accountSubType: string | null;
            parentId: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        openingBalance: number;
        currentBalance: number;
        description: string | null;
        isSystemAccount: boolean;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        parentId: string | null;
    }>;
    create(dto: CreateAccountDto, req: any): Promise<{
        id: string;
        companyId: string;
        openingBalance: number;
        currentBalance: number;
        description: string | null;
        isSystemAccount: boolean;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateAccountDto, req: any): Promise<{
        id: string;
        companyId: string;
        openingBalance: number;
        currentBalance: number;
        description: string | null;
        isSystemAccount: boolean;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        accountSubType: string | null;
        parentId: string | null;
    }>;
}
