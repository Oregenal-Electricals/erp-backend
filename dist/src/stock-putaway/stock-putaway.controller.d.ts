import { StockPutawayService } from './stock-putaway.service';
import { CreatePutawayDto, UpdatePutawayItemsDto } from './dto/stock-putaway.dto';
export declare class StockPutawayController {
    private readonly spService;
    constructor(spService: StockPutawayService);
    getStats(req: any): Promise<{
        total: number;
        inProgress: number;
        completed: number;
        totalQtyPutaway: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
            };
            _count: {
                items: number;
            };
            grn: {
                grnNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            remarks: string | null;
            warehouseId: string;
            grnId: string;
            iqcId: string | null;
            putawayNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    create(dto: CreatePutawayDto, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    updateItems(id: string, dto: UpdatePutawayItemsDto, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
    complete(id: string, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            unitCost: number;
            qty: number;
            binId: string;
            putawayId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        grn: {
            grnType: string;
            grnNumber: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
}
