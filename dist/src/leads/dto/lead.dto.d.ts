export declare class CreateLeadDto {
    companyName: string;
    contactPerson: string;
    phone?: string;
    email?: string;
    source: string;
    productInterest?: string;
    estimatedValue?: number;
    currency?: string;
    followUpDate?: string;
    followUpNotes?: string;
    assignedTo?: string;
    remarks?: string;
}
export declare class UpdateLeadDto {
    contactPerson?: string;
    phone?: string;
    email?: string;
    productInterest?: string;
    estimatedValue?: number;
    followUpDate?: string;
    followUpNotes?: string;
    assignedTo?: string;
    status?: string;
    lostReason?: string;
    remarks?: string;
}
