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
                name: string;
                code: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            productId: string;
            drawingNumber: string | null;
            specifications: import("@prisma/client/runtime/library").JsonValue | null;
            revisionNumber: string;
            changeDescription: string;
            changeType: string;
            previousRevision: string | null;
            effectiveDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByProduct(productId: string, req: any): Promise<({
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    })[]>;
    findOne(id: string, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    }>;
    create(dto: CreateProductRevisionDto, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    }>;
    update(id: string, dto: UpdateProductRevisionDto, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    }>;
    approve(id: string, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    }>;
    obsolete(id: string, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        drawingNumber: string | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        previousRevision: string | null;
        effectiveDate: Date;
    }>;
}
