import { ProductSellingPriceService } from './product-selling-price.service';
import { CreateSellingPriceDto, ReviseSellingPriceDto } from './dto/product-selling-price.dto';
export declare class ProductSellingPriceController {
    private service;
    constructor(service: ProductSellingPriceService);
    findAll(req: any, query: any): Promise<({
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
    findByProduct(productId: string, req: any): Promise<({
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
    findCurrent(productId: string, req: any): Promise<{
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
    create(dto: CreateSellingPriceDto, req: any): Promise<{
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
    revise(productId: string, dto: ReviseSellingPriceDto, req: any): Promise<{
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
