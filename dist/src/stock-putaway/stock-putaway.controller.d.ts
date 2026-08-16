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
            _count: {
                items: number;
            };
            warehouse: {
                name: string;
            };
            grn: {
                grnNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            remarks: string | null;
            warehouseId: string;
            grnId: string;
            putawayNumber: string;
            iqcId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPendingIqcs(req: any): Promise<({
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
            qty: number;
            putawayId: string;
            binId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        putawayNumber: string;
        iqcId: string | null;
    }>;
    create(dto: CreatePutawayDto, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
            qty: number;
            putawayId: string;
            binId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        putawayNumber: string;
        iqcId: string | null;
    }>;
    updateItems(id: string, dto: UpdatePutawayItemsDto, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
            qty: number;
            putawayId: string;
            binId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        putawayNumber: string;
        iqcId: string | null;
    }>;
    complete(id: string, req: any): Promise<{
        items: ({
            bin: {
                code: string;
                status: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            unitCost: number;
            uom: string;
            qty: number;
            putawayId: string;
            binId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        grn: {
            grnNumber: string;
            grnType: string;
        };
        iqc: {
            iqcNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        putawayNumber: string;
        iqcId: string | null;
    }>;
}
