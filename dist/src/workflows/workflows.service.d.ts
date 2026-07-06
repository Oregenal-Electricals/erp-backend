import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
export declare class WorkflowsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    seedDefaults(companyId: string, userId: string): Promise<{
        message: string;
        count: number;
    }>;
    create(dto: CreateWorkflowDto, user: any): Promise<{
        steps: {
            level: number;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            workflowId: string;
            stepName: string;
            approverUserId: string | null;
            timeoutHours: number | null;
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
        name: string;
        description: string | null;
        documentType: string;
        triggerCondition: string;
        triggerAmount: number | null;
        levels: number;
    }>;
    submit(dto: SubmitForApprovalDto, user: any): Promise<{
        requiresApproval: boolean;
        message: string;
        autoApproved: boolean;
        request?: undefined;
    } | {
        requiresApproval: boolean;
        request: {
            workflow: {
                name: string;
                steps: {
                    level: number;
                    id: string;
                    companyId: string;
                    isActive: boolean;
                    isTestData: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    createdBy: string | null;
                    updatedBy: string | null;
                    workflowId: string;
                    stepName: string;
                    approverUserId: string | null;
                    timeoutHours: number | null;
                }[];
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
                requestId: string;
                action: string;
                actionBy: string;
                actionDate: Date;
            }[];
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
            amount: number | null;
            documentType: string;
            workflowId: string | null;
            documentId: string;
            documentNumber: string;
            requestedBy: string;
            currentLevel: number;
            totalLevels: number;
        };
        message?: undefined;
        autoApproved?: undefined;
    }>;
    act(requestId: string, dto: ApproveRejectDto, user: any): Promise<{
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
            requestId: string;
            action: string;
            actionBy: string;
            actionDate: Date;
        }[];
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
        amount: number | null;
        documentType: string;
        workflowId: string | null;
        documentId: string;
        documentNumber: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
    }>;
    cancel(requestId: string, user: any): Promise<{
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
        amount: number | null;
        documentType: string;
        workflowId: string | null;
        documentId: string;
        documentNumber: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
    }>;
    findAllWorkflows(user: any): Promise<({
        _count: {
            requests: number;
        };
        steps: {
            level: number;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            workflowId: string;
            stepName: string;
            approverUserId: string | null;
            timeoutHours: number | null;
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
        name: string;
        description: string | null;
        documentType: string;
        triggerCondition: string;
        triggerAmount: number | null;
        levels: number;
    })[]>;
    findAllRequests(user: any, query: any): Promise<{
        data: ({
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
                requestId: string;
                action: string;
                actionBy: string;
                actionDate: Date;
            }[];
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
            amount: number | null;
            documentType: string;
            workflowId: string | null;
            documentId: string;
            documentNumber: string;
            requestedBy: string;
            currentLevel: number;
            totalLevels: number;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOneRequest(id: string, user: any): Promise<{
        workflow: {
            steps: {
                level: number;
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                workflowId: string;
                stepName: string;
                approverUserId: string | null;
                timeoutHours: number | null;
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
            name: string;
            description: string | null;
            documentType: string;
            triggerCondition: string;
            triggerAmount: number | null;
            levels: number;
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
            requestId: string;
            action: string;
            actionBy: string;
            actionDate: Date;
        }[];
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
        amount: number | null;
        documentType: string;
        workflowId: string | null;
        documentId: string;
        documentNumber: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        activeWorkflows: number;
    }>;
}
