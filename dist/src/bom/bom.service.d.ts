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
            totalCost: number | null;
            bomId: string;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            effectiveQty: number;
            unitCost: number | null;
            isCritical: boolean;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
            bomNumber: string;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            totalCost: number | null;
            revisionId: string | null;
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
            totalCost: number | null;
            bomId: string;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            effectiveQty: number;
            unitCost: number | null;
            isCritical: boolean;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
            totalCost: number | null;
            bomId: string;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            effectiveQty: number;
            unitCost: number | null;
            isCritical: boolean;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
            totalCost: number | null;
            bomId: string;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            effectiveQty: number;
            unitCost: number | null;
            isCritical: boolean;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
            totalCost: number | null;
            bomId: string;
            sequence: number;
            rawMaterialId: string | null;
            wastagePercent: number | null;
            effectiveQty: number;
            unitCost: number | null;
            isCritical: boolean;
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
        bomNumber: string;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        totalCost: number | null;
        revisionId: string | null;
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
        totalCost: number | null;
        bomId: string;
        sequence: number;
        rawMaterialId: string | null;
        wastagePercent: number | null;
        effectiveQty: number;
        unitCost: number | null;
        isCritical: boolean;
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
