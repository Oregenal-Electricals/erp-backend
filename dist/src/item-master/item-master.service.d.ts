import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateUomDto, UpdateUomDto, CreateCategoryDto, UpdateCategoryDto, CreateItemDto, UpdateItemDto } from './dto/item-master.dto';
export declare class ItemMasterService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createUom(dto: CreateUomDto, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        isBase: boolean;
    }>;
    findAllUoms(user: any): Promise<({
        _count: {
            items: number;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        isBase: boolean;
    })[]>;
    updateUom(id: string, dto: UpdateUomDto, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        isBase: boolean;
    }>;
    toggleUomStatus(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        isBase: boolean;
    }>;
    createCategory(dto: CreateCategoryDto, user: any): Promise<{
        parent: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        parentId: string | null;
    }>;
    findAllCategories(user: any): Promise<({
        _count: {
            items: number;
        };
        parent: {
            id: string;
            name: string;
            code: string;
        };
        children: {
            id: string;
            name: string;
            code: string;
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
        createdBy: string;
        updatedBy: string;
        code: string;
        parentId: string | null;
    })[]>;
    updateCategory(id: string, dto: UpdateCategoryDto, user: any): Promise<{
        parent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        code: string;
        parentId: string | null;
    }>;
    createItem(dto: CreateItemDto, user: any): Promise<{
        category: {
            id: string;
            name: string;
            code: string;
        };
        uom: {
            id: string;
            name: string;
            code: string;
        };
        purchaseUom: {
            id: string;
            name: string;
            code: string;
        };
        salesUom: {
            id: string;
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
        createdBy: string;
        updatedBy: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        itemCode: string;
        itemName: string;
        shortName: string | null;
        itemType: import("@prisma/client").$Enums.ItemType;
        categoryId: string | null;
        uomId: string;
        purchaseUomId: string | null;
        salesUomId: string | null;
        hsnCode: string | null;
        gstRate: number;
        purchaseRate: number | null;
        salesRate: number | null;
        standardCost: number | null;
        reorderLevel: number | null;
        reorderQty: number | null;
        minOrderQty: number | null;
        maxOrderQty: number | null;
        leadTimeDays: number | null;
        shelfLifeDays: number | null;
        isBatchTracked: boolean;
        isSerialTracked: boolean;
        drawingNo: string | null;
        barcode: string | null;
        abcClass: string | null;
        criticalityLevel: string | null;
        sacCode: string | null;
        lastPurchaseRate: number | null;
        isMaintenance: boolean;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
    findAllItems(user: any, filters: {
        itemType?: string;
        categoryId?: string;
        search?: string;
        status?: string;
    }): Promise<({
        category: {
            id: string;
            name: string;
            code: string;
        };
        uom: {
            id: string;
            name: string;
            code: string;
        };
        purchaseUom: {
            id: string;
            name: string;
            code: string;
        };
        salesUom: {
            id: string;
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
        createdBy: string;
        updatedBy: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        itemCode: string;
        itemName: string;
        shortName: string | null;
        itemType: import("@prisma/client").$Enums.ItemType;
        categoryId: string | null;
        uomId: string;
        purchaseUomId: string | null;
        salesUomId: string | null;
        hsnCode: string | null;
        gstRate: number;
        purchaseRate: number | null;
        salesRate: number | null;
        standardCost: number | null;
        reorderLevel: number | null;
        reorderQty: number | null;
        minOrderQty: number | null;
        maxOrderQty: number | null;
        leadTimeDays: number | null;
        shelfLifeDays: number | null;
        isBatchTracked: boolean;
        isSerialTracked: boolean;
        drawingNo: string | null;
        barcode: string | null;
        abcClass: string | null;
        criticalityLevel: string | null;
        sacCode: string | null;
        lastPurchaseRate: number | null;
        isMaintenance: boolean;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    })[]>;
    findOneItem(id: string): Promise<{
        category: {
            id: string;
            name: string;
            code: string;
        };
        uom: {
            id: string;
            name: string;
            code: string;
        };
        purchaseUom: {
            id: string;
            name: string;
            code: string;
        };
        salesUom: {
            id: string;
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
        createdBy: string;
        updatedBy: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        itemCode: string;
        itemName: string;
        shortName: string | null;
        itemType: import("@prisma/client").$Enums.ItemType;
        categoryId: string | null;
        uomId: string;
        purchaseUomId: string | null;
        salesUomId: string | null;
        hsnCode: string | null;
        gstRate: number;
        purchaseRate: number | null;
        salesRate: number | null;
        standardCost: number | null;
        reorderLevel: number | null;
        reorderQty: number | null;
        minOrderQty: number | null;
        maxOrderQty: number | null;
        leadTimeDays: number | null;
        shelfLifeDays: number | null;
        isBatchTracked: boolean;
        isSerialTracked: boolean;
        drawingNo: string | null;
        barcode: string | null;
        abcClass: string | null;
        criticalityLevel: string | null;
        sacCode: string | null;
        lastPurchaseRate: number | null;
        isMaintenance: boolean;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
    updateItem(id: string, dto: UpdateItemDto, user: any): Promise<{
        category: {
            id: string;
            name: string;
            code: string;
        };
        uom: {
            id: string;
            name: string;
            code: string;
        };
        purchaseUom: {
            id: string;
            name: string;
            code: string;
        };
        salesUom: {
            id: string;
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
        createdBy: string;
        updatedBy: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        itemCode: string;
        itemName: string;
        shortName: string | null;
        itemType: import("@prisma/client").$Enums.ItemType;
        categoryId: string | null;
        uomId: string;
        purchaseUomId: string | null;
        salesUomId: string | null;
        hsnCode: string | null;
        gstRate: number;
        purchaseRate: number | null;
        salesRate: number | null;
        standardCost: number | null;
        reorderLevel: number | null;
        reorderQty: number | null;
        minOrderQty: number | null;
        maxOrderQty: number | null;
        leadTimeDays: number | null;
        shelfLifeDays: number | null;
        isBatchTracked: boolean;
        isSerialTracked: boolean;
        drawingNo: string | null;
        barcode: string | null;
        abcClass: string | null;
        criticalityLevel: string | null;
        sacCode: string | null;
        lastPurchaseRate: number | null;
        isMaintenance: boolean;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
    toggleItemStatus(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        itemCode: string;
        itemName: string;
        shortName: string | null;
        itemType: import("@prisma/client").$Enums.ItemType;
        categoryId: string | null;
        uomId: string;
        purchaseUomId: string | null;
        salesUomId: string | null;
        hsnCode: string | null;
        gstRate: number;
        purchaseRate: number | null;
        salesRate: number | null;
        standardCost: number | null;
        reorderLevel: number | null;
        reorderQty: number | null;
        minOrderQty: number | null;
        maxOrderQty: number | null;
        leadTimeDays: number | null;
        shelfLifeDays: number | null;
        isBatchTracked: boolean;
        isSerialTracked: boolean;
        drawingNo: string | null;
        barcode: string | null;
        abcClass: string | null;
        criticalityLevel: string | null;
        sacCode: string | null;
        lastPurchaseRate: number | null;
        isMaintenance: boolean;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        active: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ItemGroupByOutputType, "itemType"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    private itemIncludes;
}
