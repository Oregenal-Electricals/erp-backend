import { PrismaService } from '../prisma/prisma.service';
export declare class PriceHistoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getItemHistory(itemCode: string, user: any): Promise<({
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
        validFrom: Date;
        validTo: Date | null;
        itemCode: string;
        itemName: string;
        itemType: string;
        uom: string | null;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    })[]>;
    getEffectivePrice(itemCode: string, user: any): Promise<({
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
        validFrom: Date;
        validTo: Date | null;
        itemCode: string;
        itemName: string;
        itemType: string;
        uom: string | null;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    })[]>;
    getListHistory(priceListId: string, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        validFrom: Date;
        validTo: Date | null;
        itemCode: string;
        itemName: string;
        itemType: string;
        uom: string | null;
        itemId: string;
        price: number;
        minQty: number | null;
        priceListId: string;
        isApproved: boolean;
    }[]>;
    getStats(user: any): Promise<{
        total: number;
        approved: number;
        active: number;
        expired: number;
        pending: number;
    }>;
    search(user: any, query: any): Promise<{
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
            validFrom: Date;
            validTo: Date | null;
            itemCode: string;
            itemName: string;
            itemType: string;
            uom: string | null;
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
}
