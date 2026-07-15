import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePoAmendmentDto, RejectAmendmentDto } from './dto/po-amendment.dto';
export declare class PoAmendmentService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateAmendmentNumber;
    create(dto: CreatePoAmendmentDto, user: any): Promise<{
        po: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
            totalAmount: number;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            po: {
                vendor: {
                    name: string;
                    code: string;
                };
                poNumber: string;
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
            requestedBy: string;
            rejectionReason: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            poId: string;
            amendmentNumber: string;
            amendmentType: string;
            changes: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        po: {
            status: string;
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
            totalAmount: number;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findByPo(poId: string, user: any): Promise<({
        po: {
            poNumber: string;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    submit(id: string, user: any): Promise<{
        po: {
            vendor: {
                name: string;
            };
            poNumber: string;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    approve(id: string, user: any): Promise<{
        po: {
            vendor: {
                name: string;
            };
            poNumber: string;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    reject(id: string, dto: RejectAmendmentDto, user: any): Promise<{
        po: {
            poNumber: string;
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
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PoAmendmentGroupByOutputType, "amendmentType"[]> & {
            _count: number;
        })[];
    }>;
}
