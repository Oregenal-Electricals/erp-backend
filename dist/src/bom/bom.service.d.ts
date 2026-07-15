import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBomDto, UpdateBomDto, CreateBomItemDto, UpdateBomItemDto } from './dto/bom.dto';
export declare class BomService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private itemIncludes;
    private generateBomNumber;
    create(dto: CreateBomDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            quantity: number;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string;
            notes: string | null;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            unitCost: number | null;
            isCritical: boolean;
            totalCost: number | null;
            bomId: string;
            effectiveQty: number;
        }[];
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            product: {
                name: string;
                code: string;
            };
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            productId: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            quantity: number;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string;
            notes: string | null;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            unitCost: number | null;
            isCritical: boolean;
            totalCost: number | null;
            bomId: string;
            effectiveQty: number;
        }[];
        product: {
            name: string;
            code: string;
        };
        revision: {
            revisionNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    findByProduct(productId: string, user: any): Promise<({
        _count: {
            items: number;
        };
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    })[]>;
    update(id: string, dto: UpdateBomDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            quantity: number;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string;
            notes: string | null;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            unitCost: number | null;
            isCritical: boolean;
            totalCost: number | null;
            bomId: string;
            effectiveQty: number;
        }[];
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    approve(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            quantity: number;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string;
            notes: string | null;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            unitCost: number | null;
            isCritical: boolean;
            totalCost: number | null;
            bomId: string;
            effectiveQty: number;
        }[];
        product: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    obsolete(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    clone(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            quantity: number;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string;
            notes: string | null;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            unitCost: number | null;
            isCritical: boolean;
            totalCost: number | null;
            bomId: string;
            effectiveQty: number;
        }[];
        product: {
            name: string;
            code: string;
        };
        revision: {
            revisionNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
    }>;
    addItem(bomId: string, dto: CreateBomItemDto, user: any, client?: any, options?: {
        skipCostRecalc?: boolean;
        skipAudit?: boolean;
        defaultWarehouseId?: string;
    }): Promise<any>;
    private ensureStockBalanceExists;
    updateItem(bomId: string, itemId: string, dto: UpdateBomItemDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        quantity: number;
        itemCode: string;
        itemName: string;
        itemType: string;
        uom: string;
        notes: string | null;
        sequence: number;
        rawMaterialId: string | null;
        wastagePercent: number | null;
        unitCost: number | null;
        isCritical: boolean;
        totalCost: number | null;
        bomId: string;
        effectiveQty: number;
    }>;
    removeItem(bomId: string, itemId: string, user: any): Promise<{
        message: string;
    }>;
    private recalculateBomCost;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        obsolete: number;
        totalItems: number;
    }>;
}
