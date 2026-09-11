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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
    getPendingIqcs(req: any): Promise<({
        grn: {
            warehouse: {
                name: string;
            };
            grnNumber: string;
            warehouseId: string;
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
        status: string;
        remarks: string | null;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            unitCost: number;
            binId: string;
            putawayId: string;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            unitCost: number;
            binId: string;
            putawayId: string;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            unitCost: number;
            binId: string;
            putawayId: string;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            qty: number;
            unitCost: number;
            binId: string;
            putawayId: string;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        warehouseId: string;
        grnId: string;
        iqcId: string | null;
        putawayNumber: string;
    }>;
}
