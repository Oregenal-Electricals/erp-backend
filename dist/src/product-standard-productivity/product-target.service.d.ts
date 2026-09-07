import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductTargetDto, ReviseProductTargetDto } from './dto/product-target.dto';
export declare class ProductTargetService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateProductTargetDto, user: any): Promise<{
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
    revise(productId: string, dto: ReviseProductTargetDto, user: any): Promise<{
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
        piecesPerManHour: number;
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
        piecesPerManHour: number;
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
        piecesPerManHour: number;
    }>;
}
