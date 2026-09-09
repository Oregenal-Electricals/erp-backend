import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';
export declare class ProductionMaterialReturnService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateNumber;
    create(dto: CreateMaterialReturnDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        reason: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        qty: number;
        warehouseId: string;
        returnedAt: Date;
        workOrderId: string;
        returnNumber: string;
        returnedById: string;
    }>;
    getPreviousMaterialStatus(workOrderId: string, user: any): Promise<{
        workOrderId: string;
        woNumber: string;
        items: {
            standardConsumed: number;
            returnedQty: number;
            accountedQty: number;
            outstandingQty: number;
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            issuedQty: number;
        }[];
        overallStatus: string;
    }>;
}
