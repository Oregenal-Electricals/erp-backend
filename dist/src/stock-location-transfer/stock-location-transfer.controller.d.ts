import { StockLocationTransferService } from './stock-location-transfer.service';
import { TransferLocationDto } from './dto/stock-location-transfer.dto';
export declare class StockLocationTransferController {
    private service;
    constructor(service: StockLocationTransferService);
    findHistory(itemCode: string, req: any): Promise<({
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
    getBinContents(binId: string, req: any): Promise<({
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
    getItemLocations(itemCode: string, req: any): Promise<({
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
    transfer(dto: TransferLocationDto, req: any): Promise<{
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
}
