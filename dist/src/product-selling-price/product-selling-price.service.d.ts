import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSellingPriceDto, ReviseSellingPriceDto } from './dto/product-selling-price.dto';
export declare class ProductSellingPriceService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateSellingPriceDto, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
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
        productId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        sellingPrice: number;
    }>;
    revise(productId: string, dto: ReviseSellingPriceDto, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
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
        productId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        sellingPrice: number;
    }>;
    findAll(user: any, query: any): Promise<({
        product: {
            id: string;
            name: string;
            code: string;
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
        productId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        sellingPrice: number;
    })[]>;
    findByProduct(productId: string, user: any): Promise<({
        product: {
            id: string;
            name: string;
            code: string;
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
        productId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        sellingPrice: number;
    })[]>;
    findCurrent(productId: string, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
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
        productId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        sellingPrice: number;
    }>;
}
