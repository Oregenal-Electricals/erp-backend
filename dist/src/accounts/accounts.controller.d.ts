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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateAccountDto, req: any): Promise<{
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
    update(id: string, dto: UpdateAccountDto, req: any): Promise<{
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
