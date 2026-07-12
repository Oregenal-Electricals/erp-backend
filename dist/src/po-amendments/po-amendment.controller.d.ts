import { PoAmendmentService } from './po-amendment.service';
import { CreatePoAmendmentDto, RejectAmendmentDto } from './dto/po-amendment.dto';
export declare class PoAmendmentController {
    private readonly poAmendmentService;
    constructor(poAmendmentService: PoAmendmentService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.PoAmendmentGroupByOutputType, "amendmentType"[]> & {
            _count: number;
        })[];
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            po: {
                vendor: {
                    code: string;
                    name: string;
                };
                poNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            reason: string;
            requestedBy: string;
            rejectionReason: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            rejectedBy: string | null;
            poId: string;
            amendmentType: string;
            changes: import("@prisma/client/runtime/library").JsonValue | null;
            amendmentNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByPo(poId: string, req: any): Promise<({
        po: {
            poNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
        po: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
            totalAmount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    }>;
    create(dto: CreatePoAmendmentDto, req: any): Promise<{
        po: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
            totalAmount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    }>;
    submit(id: string, req: any): Promise<{
        po: {
            vendor: {
                name: string;
            };
            poNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    }>;
    approve(id: string, req: any): Promise<{
        po: {
            vendor: {
                name: string;
            };
            poNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    }>;
    reject(id: string, dto: RejectAmendmentDto, req: any): Promise<{
        po: {
            poNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        reason: string;
        requestedBy: string;
        rejectionReason: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectedBy: string | null;
        poId: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
        amendmentNumber: string;
    }>;
}
