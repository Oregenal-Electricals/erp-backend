import { PriceListService } from './price-list.service';
import { CreatePriceListDto, UpdatePriceListDto, CreatePriceListItemDto, UpdatePriceListItemDto } from './dto/price-list.dto';
export declare class PriceListController {
    private readonly priceListService;
    constructor(priceListService: PriceListService);
    getStats(req: any): Promise<{
        total: number;
        active: number;
        inactive: number;
        sales: number;
        purchase: number;
        totalItems: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
        } & {
            id: string;
            companyId: string;
            code: string;
            name: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            currency: string;
            isDefault: boolean;
            listType: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
            itemCode: string;
            itemName: string;
            uom: string | null;
            itemType: string;
            priceListId: string;
            itemId: string;
            price: number;
            minQty: number | null;
            validFrom: Date;
            validTo: Date | null;
            isApproved: boolean;
        }[];
    } & {
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        isDefault: boolean;
        listType: string;
    }>;
    create(dto: CreatePriceListDto, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        isDefault: boolean;
        listType: string;
    }>;
    update(id: string, dto: UpdatePriceListDto, req: any): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        currency: string;
        isDefault: boolean;
        listType: string;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    addItem(id: string, dto: CreatePriceListItemDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        itemCode: string;
        itemName: string;
        uom: string | null;
        itemType: string;
        priceListId: string;
        itemId: string;
        price: number;
        minQty: number | null;
        validFrom: Date;
        validTo: Date | null;
        isApproved: boolean;
    }>;
    updateItem(id: string, itemId: string, dto: UpdatePriceListItemDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        itemCode: string;
        itemName: string;
        uom: string | null;
        itemType: string;
        priceListId: string;
        itemId: string;
        price: number;
        minQty: number | null;
        validFrom: Date;
        validTo: Date | null;
        isApproved: boolean;
    }>;
    approveItem(id: string, itemId: string, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        itemCode: string;
        itemName: string;
        uom: string | null;
        itemType: string;
        priceListId: string;
        itemId: string;
        price: number;
        minQty: number | null;
        validFrom: Date;
        validTo: Date | null;
        isApproved: boolean;
    }>;
    removeItem(id: string, itemId: string, req: any): Promise<{
        message: string;
    }>;
}
