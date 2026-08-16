import { PriceHistoryService } from './price-history.service';
export declare class PriceHistoryController {
    private readonly priceHistoryService;
    constructor(priceHistoryService: PriceHistoryService);
    getStats(req: any): Promise<{
        total: number;
        approved: number;
        active: number;
        expired: number;
        pending: number;
    }>;
    search(req: any, query: any): Promise<{
        data: ({
            priceList: {
                name: string;
                code: string;
                currency: string;
                listType: string;
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
            itemCode: string;
            itemName: string;
            uom: string | null;
            validFrom: Date;
            validTo: Date | null;
            itemType: string;
            itemId: string;
            price: number;
            minQty: number | null;
            priceListId: string;
            isApproved: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getItemHistory(itemCode: string, req: any): Promise<({
        priceList: {
            name: string;
            code: string;
            currency: string;
            listType: string;
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
        itemCode: string;
        itemName: string;
        uom: string | null;
        validFrom: Date;
        validTo: Date | null;
        itemType: string;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    })[]>;
    getEffectivePrice(itemCode: string, req: any): Promise<({
        priceList: {
            name: string;
            code: string;
            currency: string;
            listType: string;
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
        itemCode: string;
        itemName: string;
        uom: string | null;
        validFrom: Date;
        validTo: Date | null;
        itemType: string;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    })[]>;
    getListHistory(priceListId: string, req: any): Promise<{
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
        validFrom: Date;
        validTo: Date | null;
        itemType: string;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    }[]>;
}
