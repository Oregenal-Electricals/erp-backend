import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateWorkflowDto, UpdateWorkflowDto, SubmitForApprovalDto, ApproveRejectDto } from './dto/workflow.dto';
import { BomService } from '../bom/bom.service';
import { ProductService } from '../products/product.service';
export declare class WorkflowsService {
    private prisma;
    private audit;
    private bomService;
    private productService;
    constructor(prisma: PrismaService, audit: AuditService, bomService: BomService, productService: ProductService);
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
        triggerCondition: string;
        triggerAmount: number | null;
        levels: number;
    }>;
    update(id: string, dto: UpdateWorkflowDto, user: any): Promise<{
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
            documentId: string;
            documentNumber: string;
            amount: number | null;
            currentLevel: number;
            totalLevels: number;
            workflowId: string | null;
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
        documentId: string;
        documentNumber: string;
        amount: number | null;
        currentLevel: number;
        totalLevels: number;
        workflowId: string | null;
    }>;
    cancel(requestId: string, user: any): Promise<{
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
        documentId: string;
        documentNumber: string;
        amount: number | null;
        currentLevel: number;
        totalLevels: number;
        workflowId: string | null;
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
            documentId: string;
            documentNumber: string;
            amount: number | null;
            currentLevel: number;
            totalLevels: number;
            workflowId: string | null;
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
        documentId: string;
        documentNumber: string;
        amount: number | null;
        currentLevel: number;
        totalLevels: number;
        workflowId: string | null;
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
