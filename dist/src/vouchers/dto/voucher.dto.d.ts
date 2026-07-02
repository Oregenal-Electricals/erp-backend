export declare class VoucherEntryDto {
    accountId: string;
    entryType: string;
    amount: number;
    narration?: string;
}
export declare class CreateVoucherDto {
    voucherType: string;
    voucherDate?: string;
    referenceId?: string;
    referenceType?: string;
    referenceNumber?: string;
    partyName?: string;
    narration?: string;
    entries: VoucherEntryDto[];
}
export declare class CancelVoucherDto {
    cancelReason: string;
}
