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
            stepName: string;
            approverUserId: string | null;
            timeoutHours: number | null;
            workflowId: string;
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
        triggerAmount: number | null;
        triggerCondition: string;
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
            workflowId: string | null;
            documentId: string;
            currentLevel: number;
            totalLevels: number;
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
                stepName: string;
                approverUserId: string | null;
                timeoutHours: number | null;
                workflowId: string;
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
            triggerAmount: number | null;
            triggerCondition: string;
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
        workflowId: string | null;
        documentId: string;
        currentLevel: number;
        totalLevels: number;
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
            stepName: string;
            approverUserId: string | null;
            timeoutHours: number | null;
            workflowId: string;
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
        triggerAmount: number | null;
        triggerCondition: string;
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
                    stepName: string;
                    approverUserId: string | null;
                    timeoutHours: number | null;
                    workflowId: string;
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
            workflowId: string | null;
            documentId: string;
            currentLevel: number;
            totalLevels: number;
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
        workflowId: string | null;
        documentId: string;
        currentLevel: number;
        totalLevels: number;
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
        documentType: string;
        requestedBy: string;
        remarks: string | null;
        amount: number | null;
        documentNumber: string;
        workflowId: string | null;
        documentId: string;
        currentLevel: number;
        totalLevels: number;
    }>;
}
