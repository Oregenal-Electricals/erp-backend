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
            batchNumber: string;
            lotNumber: string | null;
            mfgDate: Date | null;
            expiryDate: Date | null;
            grnItemId: string | null;
            warehouseId: string;
            receivedDate: Date;
            grnId: string | null;
            unitCost: number;
            reservedQty: number;
            availableQty: number;
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
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        grnItemId: string | null;
        warehouseId: string;
        receivedDate: Date;
        grnId: string | null;
        unitCost: number;
        reservedQty: number;
        availableQty: number;
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
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        grnItemId: string | null;
        warehouseId: string;
        receivedDate: Date;
        grnId: string | null;
        unitCost: number;
        reservedQty: number;
        availableQty: number;
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
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        grnItemId: string | null;
        warehouseId: string;
        receivedDate: Date;
        grnId: string | null;
        unitCost: number;
        reservedQty: number;
        availableQty: number;
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
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        grnItemId: string | null;
        warehouseId: string;
        receivedDate: Date;
        grnId: string | null;
        unitCost: number;
        reservedQty: number;
        availableQty: number;
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
        batchNumber: string;
        lotNumber: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        grnItemId: string | null;
        warehouseId: string;
        receivedDate: Date;
        grnId: string | null;
        unitCost: number;
        reservedQty: number;
        availableQty: number;
        originalQty: number;
    }>;
}
