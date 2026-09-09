import { MaterialIssueOverrideService } from './material-issue-override.service';
import { RequestOverrideDto, DecideOverrideDto } from './dto/material-issue-override.dto';
export declare class MaterialIssueOverrideController {
    private service;
    constructor(service: MaterialIssueOverrideService);
    findPending(req: any): Promise<({
        workOrder: {
            productName: string;
            woNumber: string;
        };
        requestedBy: {
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
        reason: string;
        requestedById: string;
        approvedAt: Date | null;
        workOrderId: string;
        approvalRequestId: string;
        itemsSnapshot: import("@prisma/client/runtime/library").JsonValue;
        requestedAt: Date;
        deadlineAt: Date;
        approvedById: string | null;
        approverComments: string | null;
        consumedByIssueId: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            productName: string;
            woNumber: string;
        };
        requestedBy: {
            firstName: string;
            lastName: string;
        };
        approvedBy: {
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
        reason: string;
        requestedById: string;
        approvedAt: Date | null;
        workOrderId: string;
        approvalRequestId: string;
        itemsSnapshot: import("@prisma/client/runtime/library").JsonValue;
        requestedAt: Date;
        deadlineAt: Date;
        approvedById: string | null;
        approverComments: string | null;
        consumedByIssueId: string | null;
    }>;
    request(dto: RequestOverrideDto, req: any): Promise<{
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
        requestedById: string;
        approvedAt: Date | null;
        workOrderId: string;
        approvalRequestId: string;
        itemsSnapshot: import("@prisma/client/runtime/library").JsonValue;
        requestedAt: Date;
        deadlineAt: Date;
        approvedById: string | null;
        approverComments: string | null;
        consumedByIssueId: string | null;
    }>;
    decide(id: string, dto: DecideOverrideDto, req: any): Promise<{
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
        requestedById: string;
        approvedAt: Date | null;
        workOrderId: string;
        approvalRequestId: string;
        itemsSnapshot: import("@prisma/client/runtime/library").JsonValue;
        requestedAt: Date;
        deadlineAt: Date;
        approvedById: string | null;
        approverComments: string | null;
        consumedByIssueId: string | null;
    }>;
}
