import { StockBatchService } from './stock-batch.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/stock-batch.dto';
export declare class StockBatchController {
    private readonly sbService;
    constructor(sbService: StockBatchService);
    getStats(req: any): Promise<{
        total: number;
        active: number;
        expired: number;
        exhausted: number;
        quarantined: number;
        expiringIn30: number;
        totalActiveBatchQty: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
                code: string;
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
            itemCode: string;
            itemName: string;
            uom: string;
            warehouseId: string;
            unitCost: number;
            expiryDate: Date | null;
            receivedDate: Date;
            grnId: string | null;
            grnItemId: string | null;
            availableQty: number;
            reservedQty: number;
            batchNumber: string;
            lotNumber: string | null;
            mfgDate: Date | null;
            originalQty: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByItem(itemCode: string, req: any): Promise<({
        warehouse: {
            name: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        expiryDate: Date | null;
        receivedDate: Date;
        grnId: string | null;
        grnItemId: string | null;
        availableQty: number;
        reservedQty: number;
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        originalQty: number;
    })[]>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            name: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        expiryDate: Date | null;
        receivedDate: Date;
        grnId: string | null;
        grnItemId: string | null;
        availableQty: number;
        reservedQty: number;
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        originalQty: number;
    }>;
    create(dto: CreateBatchDto, req: any): Promise<{
        warehouse: {
            name: string;
            code: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        expiryDate: Date | null;
        receivedDate: Date;
        grnId: string | null;
        grnItemId: string | null;
        availableQty: number;
        reservedQty: number;
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        originalQty: number;
    }>;
    createFromGrn(grnId: string, req: any): Promise<{
        created: number;
        batches: any[];
    }>;
    update(id: string, dto: UpdateBatchDto, req: any): Promise<{
        warehouse: {
            name: string;
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        expiryDate: Date | null;
        receivedDate: Date;
        grnId: string | null;
        grnItemId: string | null;
        availableQty: number;
        reservedQty: number;
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        originalQty: number;
    }>;
    quarantine(id: string, req: any): Promise<{
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
        itemCode: string;
        itemName: string;
        uom: string;
        warehouseId: string;
        unitCost: number;
        expiryDate: Date | null;
        receivedDate: Date;
        grnId: string | null;
        grnItemId: string | null;
        availableQty: number;
        reservedQty: number;
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        originalQty: number;
    }>;
}
