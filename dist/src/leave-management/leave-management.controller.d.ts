import { LeaveManagementService } from './leave-management.service';
import { CreateLeaveTypeDto, AllocateLeaveDto, ApplyLeaveDto, ApproveLeaveDto } from './dto/leave.dto';
export declare class LeaveManagementController {
    private readonly leaveService;
    constructor(leaveService: LeaveManagementService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        leaveTypes: number;
    }>;
    getTypes(req: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }[]>;
    createType(dto: CreateLeaveTypeDto, req: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    updateType(id: string, dto: any, req: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    allocate(dto: AllocateLeaveDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        year: number;
        pending: number;
        employeeId: string;
        available: number;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
    }>;
    bulkAllocate(body: any, req: any): Promise<{
        message: string;
        created: number;
        updated: number;
        total: number;
    }>;
    getBalance(empId: string, year: string, req: any): Promise<({
        leaveType: {
            code: string;
            name: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        year: number;
        pending: number;
        employeeId: string;
        available: number;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
    })[]>;
    findAll(req: any, query: any): Promise<{
        data: ({
            employee: {
                department: {
                    name: string;
                };
                firstName: string;
                lastName: string;
                employeeNumber: string;
            };
            leaveType: {
                code: string;
                name: string;
                isPaid: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            reason: string;
            days: number;
            remarks: string | null;
            rejectionReason: string | null;
            employeeId: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            fromDate: Date;
            toDate: Date;
            leaveTypeId: string;
            applicationNumber: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    apply(dto: ApplyLeaveDto, req: any): Promise<{
        employee: {
            firstName: string;
            lastName: string;
        };
        leaveType: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        days: number;
        remarks: string | null;
        rejectionReason: string | null;
        employeeId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromDate: Date;
        toDate: Date;
        leaveTypeId: string;
        applicationNumber: string;
    }>;
    approve(id: string, dto: ApproveLeaveDto, req: any): Promise<{
        employee: {
            firstName: string;
            lastName: string;
            employeeNumber: string;
        };
        leaveType: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        days: number;
        remarks: string | null;
        rejectionReason: string | null;
        employeeId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromDate: Date;
        toDate: Date;
        leaveTypeId: string;
        applicationNumber: string;
    }>;
    cancel(id: string, req: any): Promise<{
        message: string;
    }>;
}
