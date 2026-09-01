import { ManpowerService } from './manpower.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto, AdjustManpowerDto, TransferManpowerDto, AssignEmployeesDto, EndAssignmentDto } from './dto/manpower.dto';
export declare class ManpowerController {
    private manpowerService;
    constructor(manpowerService: ManpowerService);
    findAll(req: any, query: any): Promise<({
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
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
            message: string;
            raisedToUserId: string;
            response: string | null;
            raisedByUserId: string;
            allocationId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        children: ({
            workOrder: {
                id: string;
                stageName: string;
                productName: string;
                woNumber: string;
            };
            queries: ({
                raisedBy: {
                    firstName: string;
                    lastName: string;
                };
                raisedTo: {
                    firstName: string;
                    lastName: string;
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
                message: string;
                raisedToUserId: string;
                response: string | null;
                raisedByUserId: string;
                allocationId: string;
            })[];
            fromUser: {
                role: string;
                id: string;
                firstName: string;
                lastName: string;
            };
            toUser: {
                role: string;
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            level: string;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            category: string | null;
            remarks: string | null;
            date: Date;
            parentId: string | null;
            count: number;
            workOrderId: string | null;
            toUserId: string | null;
            fromUserId: string;
        })[];
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
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
            message: string;
            raisedToUserId: string;
            response: string | null;
            raisedByUserId: string;
            allocationId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    getChain(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
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
            message: string;
            raisedToUserId: string;
            response: string | null;
            raisedByUserId: string;
            allocationId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    create(dto: CreateManpowerAllocationDto, req: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
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
            message: string;
            raisedToUserId: string;
            response: string | null;
            raisedByUserId: string;
            allocationId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    accept(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
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
            message: string;
            raisedToUserId: string;
            response: string | null;
            raisedByUserId: string;
            allocationId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    distribute(dto: DistributeManpowerDto, req: any): Promise<{
        children: any[];
        distributedTotal: any;
        parentCount: number;
        difference: number;
    }>;
    raiseQuery(dto: RaiseManpowerQueryDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        message: string;
        raisedToUserId: string;
        response: string | null;
        raisedByUserId: string;
        allocationId: string;
    }>;
    resolveQuery(id: string, dto: ResolveManpowerQueryDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        message: string;
        raisedToUserId: string;
        response: string | null;
        raisedByUserId: string;
        allocationId: string;
    }>;
    adjust(dto: AdjustManpowerDto, req: any): Promise<{
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    } | {
        pendingApproval: boolean;
        approvalRequestId: string;
        message: string;
    }>;
    transfer(dto: TransferManpowerDto, req: any): Promise<{
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    } | {
        pendingApproval: boolean;
        approvalRequestId: string;
        message: string;
    }>;
    approveRequest(requestId: string, req: any): Promise<{
        workflow: {
            name: string;
        };
        actions: {
            level: number;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            comments: string | null;
            action: string;
            actionBy: string;
            actionDate: Date;
            requestId: string;
        }[];
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
        documentType: string;
        requestedBy: string;
        remarks: string | null;
        amount: number | null;
        documentNumber: string;
        documentId: string;
        workflowId: string | null;
        currentLevel: number;
        totalLevels: number;
    }>;
    rejectRequest(requestId: string, dto: {
        comments?: string;
    }, req: any): Promise<{
        workflow: {
            name: string;
        };
        actions: {
            level: number;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            comments: string | null;
            action: string;
            actionBy: string;
            actionDate: Date;
            requestId: string;
        }[];
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
        documentType: string;
        requestedBy: string;
        remarks: string | null;
        amount: number | null;
        documentNumber: string;
        documentId: string;
        workflowId: string | null;
        currentLevel: number;
        totalLevels: number;
    }>;
    assignEmployees(dto: AssignEmployeesDto, req: any): Promise<{
        created: any[];
        createdCount: number;
        skipped: {
            employeeId: string;
            reason: string;
        }[];
        skippedCount: number;
    }>;
    endAssignment(id: string, dto: EndAssignmentDto, req: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeNumber: string;
            departmentId: string;
            designationId: string;
        };
        assignedBy: {
            id: string;
            firstName: string;
            lastName: string;
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
        remarks: string | null;
        employeeId: string;
        stageName: string | null;
        workOrderId: string | null;
        allocationId: string | null;
        activityType: string;
        startTime: Date;
        endTime: Date | null;
        assignedByUserId: string;
    }>;
    getCurrentRoster(query: any, req: any): Promise<({
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeNumber: string;
            departmentId: string;
            designationId: string;
        };
        assignedBy: {
            id: string;
            firstName: string;
            lastName: string;
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
        remarks: string | null;
        employeeId: string;
        stageName: string | null;
        workOrderId: string | null;
        allocationId: string | null;
        activityType: string;
        startTime: Date;
        endTime: Date | null;
        assignedByUserId: string;
    })[]>;
    getManpowerAvailability(query: any, req: any): Promise<{
        date: string;
        totalEmployees: number;
        totalPresent: number;
        absent: number;
        leave: number;
        weekOff: number;
        holiday: number;
        productionEligiblePresent: number;
        allocated: number;
        unallocated: number;
        temporarilyUnavailable: number;
        reconciles: boolean;
        exceptions: {
            employeeNumber: string;
            employeeName: string;
            issue: string;
        }[];
        workers: {
            employeeId: any;
            employeeNumber: any;
            employeeName: string;
            department: any;
            designation: any;
            skill: any;
            shift: {
                id: string;
                name: string;
                startTime: string;
                endTime: string;
            };
            attendanceStatus: string;
            inTime: Date;
            outTime: Date;
            allocationStatus: string;
            availabilityStatus: string;
            currentStage: string;
            currentWorkOrder: string;
            currentActivityType: string;
        }[];
    }>;
    getEmployeeTimeline(employeeId: string, date: string, req: any): Promise<{
        employee: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            phone: string;
            email: string;
            status: string;
            firstName: string;
            lastName: string;
            userId: string | null;
            remarks: string | null;
            bankName: string | null;
            employeeNumber: string;
            dateOfBirth: Date | null;
            dateOfJoining: Date;
            dateOfLeaving: Date | null;
            departmentId: string;
            designationId: string;
            reportingManagerId: string | null;
            employmentType: string;
            costType: string;
            hourlyRate: number | null;
            contractorId: string | null;
            isTrial: boolean;
            trialStartDate: Date | null;
            trialEndDate: Date | null;
            gender: string;
            panNumber: string | null;
            aadharNumber: string | null;
            pfNumber: string | null;
            esiNumber: string | null;
            bankAccountNumber: string | null;
            bankIfscCode: string | null;
            basicSalary: number;
            hraAmount: number;
            conveyanceAmount: number;
            otherAllowances: number;
            emergencyContact: string | null;
            emergencyPhone: string | null;
            isProductionEligible: boolean;
            skill: string | null;
            profilePhoto: string | null;
        };
        attendance: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            checkIn: Date | null;
            checkOut: Date | null;
            employeeId: string;
            shiftId: string | null;
            attendanceDate: Date;
            lunchOut: Date | null;
            lunchIn: Date | null;
            lunchMinutes: number;
            grossWorkedMinutes: number;
            netWorkedMinutes: number;
            netWorkedRounded: number;
            workedHours: number;
            otHours: number;
            otRate: number;
            otAmount: number;
            isHoliday: boolean;
            markedBy: string | null;
        };
        assignments: ({
            workOrder: {
                id: string;
                stageName: string;
                productName: string;
                woNumber: string;
            };
            employee: {
                id: string;
                firstName: string;
                lastName: string;
                employeeNumber: string;
                departmentId: string;
                designationId: string;
            };
            assignedBy: {
                id: string;
                firstName: string;
                lastName: string;
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
            remarks: string | null;
            employeeId: string;
            stageName: string | null;
            workOrderId: string | null;
            allocationId: string | null;
            activityType: string;
            startTime: Date;
            endTime: Date | null;
            assignedByUserId: string;
        })[];
    }>;
    getReconciliation(date: string, req: any): Promise<{
        date: string;
        hrPresent: number;
        accounted: number;
        unallocated: number;
        inGracePeriod: number;
        accountedPercent: number;
        stageBreakdown: {
            key: string;
            count: number;
        }[];
        unallocatedEmployees: any[];
        graceMinutes: number;
    }>;
}
