import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
export declare class WorkflowsController {
    private readonly wfService;
    constructor(wfService: WorkflowsService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
        activeWorkflows: number;
    }>;
    findAllWorkflows(req: any): Promise<({
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
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        documentType: string;
        triggerCondition: string;
        triggerAmount: number | null;
        levels: number;
    })[]>;
    findAllRequests(req: any, query: any): Promise<{
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            documentType: string;
            documentNumber: string;
            workflowId: string | null;
            documentId: string;
            requestedBy: string;
            currentLevel: number;
            totalLevels: number;
            amount: number | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOneRequest(id: string, req: any): Promise<{
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
            name: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        documentType: string;
        documentNumber: string;
        workflowId: string | null;
        documentId: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
        amount: number | null;
    }>;
    seed(req: any): Promise<{
        message: string;
        count: number;
    }>;
    create(dto: CreateWorkflowDto, req: any): Promise<{
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
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        documentType: string;
        triggerCondition: string;
        triggerAmount: number | null;
        levels: number;
    }>;
    submit(dto: SubmitForApprovalDto, req: any): Promise<{
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            documentType: string;
            documentNumber: string;
            workflowId: string | null;
            documentId: string;
            requestedBy: string;
            currentLevel: number;
            totalLevels: number;
            amount: number | null;
        };
        message?: undefined;
        autoApproved?: undefined;
    }>;
    act(id: string, dto: ApproveRejectDto, req: any): Promise<{
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        documentType: string;
        documentNumber: string;
        workflowId: string | null;
        documentId: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
        amount: number | null;
    }>;
    cancel(id: string, req: any): Promise<{
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
        documentType: string;
        documentNumber: string;
        workflowId: string | null;
        documentId: string;
        requestedBy: string;
        currentLevel: number;
        totalLevels: number;
        amount: number | null;
    }>;
}
