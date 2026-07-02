export declare class CreateArInvoiceDto {
    dispatchId?: string;
    soId?: string;
    customerName: string;
    customerAddress?: string;
    invoiceDate?: string;
    dueDate?: string;
    paymentTerms?: string;
    subtotal: number;
    totalGst: number;
    totalAmount: number;
    notes?: string;
}
export declare class CreateArPaymentDto {
    invoiceId: string;
    paymentDate?: string;
    amount: number;
    paymentMode: string;
    referenceNumber?: string;
    bankAccountId?: string;
    remarks?: string;
}
