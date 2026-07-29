export declare class CreateCapaDto {
    ncrId: string;
    rootCause?: string;
    correctiveAction: string;
    preventiveAction?: string;
    assignedTo?: string;
    dueDate: string;
    remarks?: string;
}
export declare class UpdateCapaDto {
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    assignedTo?: string;
    dueDate?: string;
    status?: string;
    remarks?: string;
}
export declare class VerifyCapaDto {
    effectivenessCheck: string;
}
