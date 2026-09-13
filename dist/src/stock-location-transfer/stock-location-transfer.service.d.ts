import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLocationBalanceService } from '../stock-location-balance/stock-location-balance.service';
import { TransferLocationDto } from './dto/stock-location-transfer.dto';
export declare class StockLocationTransferService {
    private prisma;
    private audit;
    private locationBalance;
    constructor(prisma: PrismaService, audit: AuditService, locationBalance: StockLocationBalanceService);
    private generateNumber;
    transfer(dto: TransferLocationDto, user: any): Promise<{
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
            uom: string;
            qty: number;
            unitCost: number;
            batchId: string | null;
            transferId: string;
        }[];
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    }>;
    getBinContents(binId: string, user: any): Promise<({
        batch: {
            batchNumber: string;
            expiryDate: Date;
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
        itemCode: string;
        itemName: string;
        qty: number;
        warehouseId: string;
        batchId: string | null;
        binId: string;
    })[]>;
    getItemLocations(itemCode: string, user: any): Promise<({
        bin: {
            code: string;
            rackId: string;
        };
        batch: {
            batchNumber: string;
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
        itemCode: string;
        itemName: string;
        qty: number;
        warehouseId: string;
        batchId: string | null;
        binId: string;
    })[]>;
    findHistory(user: any, itemCode?: string): Promise<({
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
            uom: string;
            qty: number;
            unitCost: number;
            batchId: string | null;
            transferId: string;
        }[];
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
        transferType: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        fromBinId: string | null;
        toBinId: string | null;
        transferNumber: string;
    })[]>;
}
