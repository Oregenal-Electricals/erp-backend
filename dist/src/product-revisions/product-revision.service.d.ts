import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductRevisionDto, UpdateProductRevisionDto } from './dto/product-revision.dto';
export declare class ProductRevisionService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(dto: CreateProductRevisionDto, user: any): Promise<{
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            product: {
                code: string;
                name: string;
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
            specifications: import("@prisma/client/runtime/library").JsonValue | null;
            drawingNumber: string | null;
            productId: string;
            revisionNumber: string;
            changeDescription: string;
            changeType: string;
            previousRevision: string | null;
            effectiveDate: Date;
            approvedBy: string | null;
            approvedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    }>;
    findByProduct(productId: string, user: any): Promise<({
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    })[]>;
    update(id: string, dto: UpdateProductRevisionDto, user: any): Promise<{
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    }>;
    approve(id: string, user: any): Promise<{
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    }>;
    obsolete(id: string, user: any): Promise<{
        product: {
            code: string;
            name: string;
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
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        drawingNumber: string | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
        approvedBy: string | null;
        approvedAt: Date | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        obsolete: number;
    }>;
}
