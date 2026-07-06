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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }[]>;
    createType(dto: CreateLeaveTypeDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    updateType(id: string, dto: any, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        name: string;
        description: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    allocate(dto: AllocateLeaveDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        year: number;
        pending: number;
        employeeId: string;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
        available: number;
    }>;
    bulkAllocate(body: any, req: any): Promise<{
        message: string;
        created: number;
        updated: number;
        total: number;
    }>;
    getBalance(empId: string, year: string, req: any): Promise<({
        leaveType: {
            name: string;
            code: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        year: number;
        pending: number;
        employeeId: string;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
        available: number;
    })[]>;
    findAll(req: any, query: any): Promise<{
        data: ({
            employee: {
                firstName: string;
                lastName: string;
                employeeNumber: string;
                department: {
                    name: string;
                };
            };
            leaveType: {
                name: string;
                code: string;
                isPaid: boolean;
            };
        } & {
            id: string;
            companyId: string;
            status: string;
            remarks: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            reason: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            fromDate: Date;
            toDate: Date;
            employeeId: string;
            leaveTypeId: string;
            applicationNumber: string;
            days: number;
            rejectionReason: string | null;
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
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        reason: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromDate: Date;
        toDate: Date;
        employeeId: string;
        leaveTypeId: string;
        applicationNumber: string;
        days: number;
        rejectionReason: string | null;
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
        companyId: string;
        status: string;
        remarks: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        reason: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromDate: Date;
        toDate: Date;
        employeeId: string;
        leaveTypeId: string;
        applicationNumber: string;
        days: number;
        rejectionReason: string | null;
    }>;
    cancel(id: string, req: any): Promise<{
        message: string;
    }>;
}
