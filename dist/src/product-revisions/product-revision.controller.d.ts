import { ProductRevisionService } from './product-revision.service';
import { CreateProductRevisionDto, UpdateProductRevisionDto } from './dto/product-revision.dto';
export declare class ProductRevisionController {
    private readonly productRevisionService;
    constructor(productRevisionService: ProductRevisionService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        obsolete: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            product: {
                code: string;
                name: string;
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
            productId: string;
            revisionNumber: string;
            changeType: string;
            changeDescription: string;
            effectiveDate: Date;
            drawingNumber: string | null;
            specifications: import("@prisma/client/runtime/library").JsonValue | null;
            previousRevision: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByProduct(productId: string, req: any): Promise<({
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    }>;
    create(dto: CreateProductRevisionDto, req: any): Promise<{
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    }>;
    update(id: string, dto: UpdateProductRevisionDto, req: any): Promise<{
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    }>;
    approve(id: string, req: any): Promise<{
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    }>;
    obsolete(id: string, req: any): Promise<{
        product: {
            code: string;
            name: string;
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
        productId: string;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        effectiveDate: Date;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        previousRevision: string | null;
    }>;
}
