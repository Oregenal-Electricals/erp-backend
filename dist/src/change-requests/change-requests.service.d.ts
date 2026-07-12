import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateChangeRequestDto, UpdateChangeRequestDto, ReviewChangeRequestDto, AddCommentDto } from './dto/change-request.dto';
import { ChangeRequestStatus } from '@prisma/client';
export declare class ChangeRequestsService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
    create(dto: CreateChangeRequestDto, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    findAll(user: any, filters: {
        status?: ChangeRequestStatus;
        type?: string;
        myRequests?: boolean;
        pendingApproval?: boolean;
    }): Promise<({
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        comments: ({
            commenter: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            comment: string;
            changeRequestId: string;
            commentBy: string;
        })[];
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    update(id: string, dto: UpdateChangeRequestDto, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    submit(id: string, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    approve(id: string, dto: ReviewChangeRequestDto, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    reject(id: string, dto: ReviewChangeRequestDto, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    cancel(id: string, user: any): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        requestedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string;
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        type: import("@prisma/client").$Enums.ChangeRequestType;
        title: string;
        priority: string;
        dueDate: Date | null;
        reviewComment: string | null;
        requestNumber: string;
        reviewedAt: Date | null;
        submittedAt: Date | null;
        requestedById: string;
        reviewedById: string | null;
    }>;
    addComment(id: string, dto: AddCommentDto, user: any): Promise<{
        commenter: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        comment: string;
        changeRequestId: string;
        commentBy: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        submitted: number;
        underReview: number;
        approved: number;
        rejected: number;
        myTotal: number;
        pendingApproval: number;
    }>;
    private includeRelations;
}
