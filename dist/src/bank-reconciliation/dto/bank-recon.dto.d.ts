export declare class BankStatementLineDto {
    transactionDate: string;
    description: string;
    referenceNumber?: string;
    debitAmount?: number;
    creditAmount?: number;
    balance?: number;
}
export declare class CreateBankStatementDto {
    bankAccountId: string;
    bankAccountName: string;
    period: string;
    openingBalance: number;
    remarks?: string;
    lines: BankStatementLineDto[];
}
export declare class ReconcileLineDto {
    lineId: string;
    voucherEntryId?: string;
}
