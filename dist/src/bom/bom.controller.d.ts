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
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
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
            brand: string;
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
        revisionId: string | null;
        version: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        bomNumber: string;
        totalCost: number | null;
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
            brand: string;
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
        sequence: number;
        rawMaterialId: string | null;
        wastagePercent: number | null;
        unitCost: number | null;
        isCritical: boolean;
        totalCost: number | null;
        bomId: string;
        effectiveQty: number;
    }>;
    removeItem(id: string, itemId: string, req: any): Promise<{
        message: string;
    }>;
}
