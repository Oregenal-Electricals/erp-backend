import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductFamilyDto, UpdateProductFamilyDto, AssignProductsToFamilyDto } from './dto/product-family.dto';
export declare class ProductFamilyService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateProductFamilyDto, user: any): Promise<{
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
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    update(id: string, dto: UpdateProductFamilyDto, user: any): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    assignProducts(id: string, dto: AssignProductsToFamilyDto, user: any): Promise<{
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
    removeProduct(productId: string, user: any): Promise<{
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
        brand: string | null;
        model: string | null;
        revision: string | null;
        drawingNumber: string | null;
        familyId: string | null;
    }>;
}
