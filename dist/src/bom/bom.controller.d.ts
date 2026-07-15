import { BomService } from './bom.service';
import { CreateBomDto, UpdateBomDto, CreateBomItemDto, UpdateBomItemDto } from './dto/bom.dto';
export declare class BomController {
    private readonly bomService;
    constructor(bomService: BomService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        obsolete: number;
        totalItems: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
    findByProduct(productId: string, req: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateBomDto, req: any): Promise<{
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
    update(id: string, dto: UpdateBomDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    approve(id: string, req: any): Promise<{
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
    obsolete(id: string, req: any): Promise<{
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
    clone(id: string, req: any): Promise<{
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
    addItem(id: string, dto: CreateBomItemDto, req: any): Promise<any>;
    updateItem(id: string, itemId: string, dto: UpdateBomItemDto, req: any): Promise<{
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
    removeItem(id: string, itemId: string, req: any): Promise<{
        message: string;
    }>;
}
