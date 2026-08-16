import { ManpowerService } from './manpower.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto, AdjustManpowerDto, TransferManpowerDto } from './dto/manpower.dto';
export declare class ManpowerController {
    private manpowerService;
    constructor(manpowerService: ManpowerService);
    findAll(req: any, query: any): Promise<({
        workOrder: {
            id: string;
            woNumber: string;
            productName: string;
            stageName: string;
        };
        fromUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        toUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            message: string;
            allocationId: string;
            raisedByUserId: string;
            raisedToUserId: string;
            response: string | null;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            woNumber: string;
            productName: string;
            stageName: string;
        };
        children: ({
            workOrder: {
                id: string;
                woNumber: string;
                productName: string;
                stageName: string;
            };
            fromUser: {
                id: string;
                firstName: string;
                lastName: string;
                role: string;
            };
            toUser: {
                id: string;
                firstName: string;
                lastName: string;
                role: string;
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
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                isActive: boolean;
                isTestData: boolean;
                status: string;
                message: string;
                allocationId: string;
                raisedByUserId: string;
                raisedToUserId: string;
                response: string | null;
            })[];
        } & {
            level: string;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            count: number;
            status: string;
            remarks: string | null;
            category: string | null;
            workOrderId: string | null;
            parentId: string | null;
            date: Date;
            fromUserId: string;
            toUserId: string | null;
        })[];
        fromUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        toUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            message: string;
            allocationId: string;
            raisedByUserId: string;
            raisedToUserId: string;
            response: string | null;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
    }>;
    getChain(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            woNumber: string;
            productName: string;
            stageName: string;
        };
        fromUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        toUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            message: string;
            allocationId: string;
            raisedByUserId: string;
            raisedToUserId: string;
            response: string | null;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
    }>;
    create(dto: CreateManpowerAllocationDto, req: any): Promise<{
        workOrder: {
            id: string;
            woNumber: string;
            productName: string;
            stageName: string;
        };
        fromUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        toUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            message: string;
            allocationId: string;
            raisedByUserId: string;
            raisedToUserId: string;
            response: string | null;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
    }>;
    accept(id: string, req: any): Promise<{
        workOrder: {
            id: string;
            woNumber: string;
            productName: string;
            stageName: string;
        };
        fromUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
        };
        toUser: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            message: string;
            allocationId: string;
            raisedByUserId: string;
            raisedToUserId: string;
            response: string | null;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        message: string;
        allocationId: string;
        raisedByUserId: string;
        raisedToUserId: string;
        response: string | null;
    }>;
    resolveQuery(id: string, dto: ResolveManpowerQueryDto, req: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        message: string;
        allocationId: string;
        raisedByUserId: string;
        raisedToUserId: string;
        response: string | null;
    }>;
    adjust(dto: AdjustManpowerDto, req: any): Promise<{
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
    } | {
        pendingApproval: boolean;
        approvalRequestId: string;
        message: string;
    }>;
    transfer(dto: TransferManpowerDto, req: any): Promise<{
        level: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        count: number;
        status: string;
        remarks: string | null;
        category: string | null;
        workOrderId: string | null;
        parentId: string | null;
        date: Date;
        fromUserId: string;
        toUserId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            comments: string | null;
            requestId: string;
            action: string;
            actionBy: string;
            actionDate: Date;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        documentType: string;
        documentNumber: string;
        amount: number | null;
        documentId: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
        workflowId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            comments: string | null;
            requestId: string;
            action: string;
            actionBy: string;
            actionDate: Date;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        documentType: string;
        documentNumber: string;
        amount: number | null;
        documentId: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
        workflowId: string | null;
    }>;
}
