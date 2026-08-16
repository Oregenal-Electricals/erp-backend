import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto, AdjustManpowerDto, TransferManpowerDto } from './dto/manpower.dto';
export declare class ManpowerService {
    private prisma;
    private audit;
    private workflows;
    private notifications;
    constructor(prisma: PrismaService, audit: AuditService, workflows: WorkflowsService, notifications: NotificationsService);
    private includes;
    create(dto: CreateManpowerAllocationDto, user: any): Promise<{
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
    accept(id: string, user: any): Promise<{
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
    distribute(dto: DistributeManpowerDto, user: any): Promise<{
        children: any[];
        distributedTotal: any;
        parentCount: number;
        difference: number;
    }>;
    findAll(user: any, query: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    getChain(rootId: string, user: any): Promise<{
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
    raiseQuery(dto: RaiseManpowerQueryDto, user: any): Promise<{
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
    resolveQuery(id: string, dto: ResolveManpowerQueryDto, user: any): Promise<{
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
    requestAdjust(dto: AdjustManpowerDto, user: any): Promise<{
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
    requestTransfer(dto: TransferManpowerDto, user: any): Promise<{
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
    private executeTransfer;
    approveManpowerRequest(requestId: string, user: any): Promise<{
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
    rejectManpowerRequest(requestId: string, user: any, comments?: string): Promise<{
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
    private notifyAdmins;
}
