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
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PoAmendmentGroupByOutputType, "amendmentType"[]> & {
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            poId: string;
            reason: string;
            rejectionReason: string | null;
            requestedBy: string;
            rejectedBy: string | null;
            amendmentNumber: string;
            amendmentType: string;
            changes: import("@prisma/client/runtime/library").JsonValue | null;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        po: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            totalAmount: number;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreatePoAmendmentDto, req: any): Promise<{
        po: {
            status: string;
            vendor: {
                code: string;
                name: string;
            };
            totalAmount: number;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    reject(id: string, dto: RejectAmendmentDto, req: any): Promise<{
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
        approvedBy: string | null;
        approvedAt: Date | null;
        poId: string;
        reason: string;
        rejectionReason: string | null;
        requestedBy: string;
        rejectedBy: string | null;
        amendmentNumber: string;
        amendmentType: string;
        changes: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
