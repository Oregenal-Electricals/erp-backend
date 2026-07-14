import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateLeaveTypeDto, AllocateLeaveDto, ApplyLeaveDto, ApproveLeaveDto } from './dto/leave.dto';
export declare class LeaveManagementService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateAppNumber;
    private calculateDays;
    createLeaveType(dto: CreateLeaveTypeDto, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    updateLeaveType(id: string, dto: any, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }>;
    findAllLeaveTypes(user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        daysAllowed: number;
        isPaid: boolean;
        carryForward: boolean;
        maxCarryForward: number;
        applicableGender: string;
        requiresApproval: boolean;
    }[]>;
    allocateLeave(dto: AllocateLeaveDto, user: any): Promise<{
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
        available: number;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
    }>;
    bulkAllocate(leaveTypeId: string, year: number, user: any): Promise<{
        message: string;
        created: number;
        updated: number;
        total: number;
    }>;
    getEmployeeBalances(employeeId: string, year: number, user: any): Promise<({
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
        available: number;
        carryForward: number;
        leaveTypeId: string;
        allocated: number;
        used: number;
    })[]>;
    applyLeave(dto: ApplyLeaveDto, user: any): Promise<{
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    approveLeave(id: string, dto: ApproveLeaveDto, user: any): Promise<{
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
    cancelLeave(id: string, user: any): Promise<{
        message: string;
    }>;
    findAllApplications(user: any, query: any): Promise<{
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
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        leaveTypes: number;
    }>;
}
