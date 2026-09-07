import { ProductTargetService } from './product-target.service';
import { CreateProductTargetDto, ReviseProductTargetDto } from './dto/product-target.dto';
export declare class ProductTargetController {
    private service;
    constructor(service: ProductTargetService);
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
        piecesPerManHour: number;
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
        piecesPerManHour: number;
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
        piecesPerManHour: number;
    }>;
    create(dto: CreateProductTargetDto, req: any): Promise<{
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
        piecesPerManHour: number;
    }>;
    revise(productId: string, dto: ReviseProductTargetDto, req: any): Promise<{
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
        piecesPerManHour: number;
    }>;
}
