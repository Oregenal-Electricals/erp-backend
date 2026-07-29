export declare class CreatePaymentInstrumentDto {
    ipoId: string;
    piId?: string;
    instrumentType: string;
    bankName: string;
    bankReference?: string;
    vendorBankName?: string;
    vendorSwiftCode?: string;
    amount: number;
    amountInr: number;
    issueDate?: string;
    expiryDate?: string;
    latestShipmentDate?: string;
    presentationDays?: number;
    notes?: string;
}
export declare class UpdatePaymentInstrumentDto {
    bankReference?: string;
    expiryDate?: string;
    latestShipmentDate?: string;
    presentationDays?: number;
    notes?: string;
}
