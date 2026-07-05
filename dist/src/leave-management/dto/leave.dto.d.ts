export declare class CreateLeaveTypeDto {
    code: string;
    name: string;
    daysAllowed: number;
    isPaid?: boolean;
    carryForward?: boolean;
    maxCarryForward?: number;
    applicableGender?: string;
    requiresApproval?: boolean;
    description?: string;
}
export declare class AllocateLeaveDto {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    allocated: number;
    carryForward?: number;
}
export declare class ApplyLeaveDto {
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    reason: string;
    remarks?: string;
}
export declare class ApproveLeaveDto {
    action: string;
    rejectionReason?: string;
    remarks?: string;
}
