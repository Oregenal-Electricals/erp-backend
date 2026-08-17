import { ProductFamilyService } from './product-family.service';
import { CreateProductFamilyDto, UpdateProductFamilyDto, AssignProductsToFamilyDto } from './dto/product-family.dto';
export declare class ProductFamilyController {
    private readonly productFamilyService;
    constructor(productFamilyService: ProductFamilyService);
    findAll(req: any, query: any): Promise<{
        data: ({
            products: {
                id: string;
                name: string;
                isActive: boolean;
                code: string;
                productType: string;
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
            code: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        products: {
            id: string;
            name: string;
            isActive: boolean;
            code: string;
            productType: string;
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
        code: string;
    }>;
    create(dto: CreateProductFamilyDto, req: any): Promise<{
        products: {
            id: string;
            name: string;
            isActive: boolean;
            code: string;
            productType: string;
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
        code: string;
    }>;
    update(id: string, dto: UpdateProductFamilyDto, req: any): Promise<{
        products: {
            id: string;
            name: string;
            isActive: boolean;
            code: string;
            productType: string;
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
        code: string;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    assignProducts(id: string, dto: AssignProductsToFamilyDto, req: any): Promise<{
        products: {
            id: string;
            name: string;
            isActive: boolean;
            code: string;
            productType: string;
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
        code: string;
    }>;
    removeProduct(productId: string, req: any): Promise<{
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
        code: string;
        categoryId: string | null;
        uomId: string | null;
        hsnCode: string | null;
        gstRate: number | null;
        minOrderQty: number | null;
        leadTimeDays: number | null;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        productType: string;
        familyId: string | null;
        brand: string | null;
        model: string | null;
        revision: string | null;
        drawingNumber: string | null;
    }>;
}
