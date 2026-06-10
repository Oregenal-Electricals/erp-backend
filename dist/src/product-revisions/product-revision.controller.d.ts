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
    findByProduct(productId: string, req: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateProductRevisionDto, req: any): Promise<{
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
    update(id: string, dto: UpdateProductRevisionDto, req: any): Promise<{
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
    approve(id: string, req: any): Promise<{
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
    obsolete(id: string, req: any): Promise<{
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
}
