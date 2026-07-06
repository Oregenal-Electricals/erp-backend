export declare class CreateGroupDto {
    code: string;
    name: string;
    type: string;
    nature: string;
    parentGroupId?: string;
    description?: string;
}
export declare class CreateAccountDto {
    code: string;
    name: string;
    groupId: string;
    description?: string;
    openingBalance?: number;
    openingBalanceType?: string;
    isBankAccount?: boolean;
    isCashAccount?: boolean;
    gstApplicable?: boolean;
    taxRate?: number;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
}
