export declare class CreateAccountDto {
    accountCode: string;
    accountName: string;
    accountType: string;
    accountSubType?: string;
    parentId?: string;
    openingBalance?: number;
    description?: string;
}
export declare class UpdateAccountDto {
    accountName?: string;
    description?: string;
    isActive?: boolean;
}
