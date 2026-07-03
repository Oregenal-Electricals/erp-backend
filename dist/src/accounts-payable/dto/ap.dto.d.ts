export declare class CreateApBillDto {
    vendorBillNumber: string;
    vendorId?: string;
    vendorName: string;
    poId?: string;
    billDate?: string;
    dueDate?: string;
    paymentTerms?: string;
    subtotal: number;
    totalGst: number;
    totalAmount: number;
    remarks?: string;
}
export declare class CreateApPaymentDto {
    billId: string;
    paymentDate?: string;
    amount: number;
    paymentMode: string;
    referenceNumber?: string;
    bankAccountId?: string;
    remarks?: string;
}
