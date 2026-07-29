export declare class CreateProgramDto {
    code: string;
    name: string;
    category?: string;
    description?: string;
    durationHours?: number;
    isMandatory?: boolean;
    validityMonths?: number;
    targetDesignation?: string;
    targetDepartment?: string;
}
export declare class CreateSessionDto {
    trainingProgramId: string;
    title: string;
    startDate: string;
    endDate: string;
    venue?: string;
    trainer?: string;
    maxParticipants?: number;
    remarks?: string;
}
export declare class EnrollDto {
    sessionId: string;
    employeeIds: string[];
}
export declare class MarkAttendanceDto {
    records: {
        enrollmentId: string;
        attended: boolean;
    }[];
}
export declare class UpdateEnrollmentDto {
    score?: number;
    passed?: boolean;
    remarks?: string;
}
