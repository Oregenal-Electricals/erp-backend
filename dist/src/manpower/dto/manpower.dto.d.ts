export declare class CreateManpowerAllocationDto {
    date: string;
    level: string;
    category?: string;
    toUserId: string;
    parentId?: string;
    count?: number;
    remarks?: string;
}
export declare class DistributeManpowerDto {
    parentId: string;
    lines: {
        toUserId?: string;
        workOrderId?: string;
        category?: string;
        count: number;
        remarks?: string;
    }[];
}
export declare class RaiseManpowerQueryDto {
    allocationId: string;
    message: string;
}
export declare class ResolveManpowerQueryDto {
    response: string;
}
export declare class AdjustManpowerDto {
    allocationId: string;
    delta: number;
    reason?: string;
}
export declare class TransferManpowerDto {
    allocationId: string;
    toWorkOrderId: string;
    qty: number;
    reason?: string;
}
export declare class AssignEmployeesDto {
    employeeIds: string[];
    allocationId?: string;
    workOrderId?: string;
    stageName?: string;
    activityType?: string;
    startTime?: string;
    plannedEndTime?: string;
    remarks?: string;
}
export declare class EndAssignmentDto {
    endTime?: string;
}
