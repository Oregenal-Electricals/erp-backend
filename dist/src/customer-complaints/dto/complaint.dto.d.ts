export declare class CreateComplaintDto {
    customerId?: string;
    customerName: string;
    customerPo?: string;
    invoiceNumber?: string;
    itemCode: string;
    itemName: string;
    batchNumber?: string;
    complaintDate?: string;
    receivedDate?: string;
    complaintType: string;
    description: string;
    qtyAffected?: number;
    customerRequest?: string;
    severity: string;
    assignedTo?: string;
    remarks?: string;
}
export declare class UpdateComplaintDto {
    assignedTo?: string;
    rootCause?: string;
    correctiveAction?: string;
    eighthDNumber?: string;
    status?: string;
    remarks?: string;
}
export declare class RespondComplaintDto {
    rootCause: string;
    correctiveAction: string;
    eighthDNumber?: string;
    remarks?: string;
}
