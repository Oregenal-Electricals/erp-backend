import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/stock-batch.dto';
export declare class StockBatchService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateBatchNumber;
    create(dto: CreateBatchDto, user: any): Promise<{
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
    createFromGrn(grnId: string, user: any): Promise<{
        created: number;
        batches: any[];
    }>;
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    findByItem(itemCode: string, user: any): Promise<({
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
    update(id: string, dto: UpdateBatchDto, user: any): Promise<{
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
    quarantine(id: string, user: any): Promise<{
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
    getStats(user: any): Promise<{
        total: number;
        active: number;
        expired: number;
        exhausted: number;
        quarantined: number;
        expiringIn30: number;
        totalActiveBatchQty: number;
    }>;
}
