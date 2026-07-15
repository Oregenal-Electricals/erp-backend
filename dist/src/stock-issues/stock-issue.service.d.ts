import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateStockIssueDto } from './dto/stock-issue.dto';
export declare class StockIssueService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateIssueNumber;
    allocateBatches(companyId: string, warehouseId: string, itemCode: string, requiredQty: number, method?: string): Promise<any[]>;
    getFifoPlan(warehouseId: string, itemCode: string, qty: number, method: string, user: any): Promise<{
        itemCode: string;
        warehouseId: string;
        requestedQty: number;
        method: string;
        allocation: {
            batchNumber: any;
            lotNumber: any;
            receivedDate: any;
            expiryDate: any;
            availableQty: any;
            toIssueQty: any;
            unitCost: any;
        }[];
    }>;
    create(dto: CreateStockIssueDto, user: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            unitCost: number;
            requestedQty: number;
            issuedQty: number;
            batchId: string | null;
            issueId: string;
        })[];
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
        warehouseId: string;
        referenceType: string;
        referenceId: string | null;
        issueNumber: string;
        issuedTo: string;
        issueMethod: string;
    }>;
    confirm(id: string, user: any): Promise<{
        items: ({
            batch: {
                batchNumber: string;
                lotNumber: string;
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
            unitCost: number;
            requestedQty: number;
            issuedQty: number;
            batchId: string | null;
            issueId: string;
        })[];
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
        warehouseId: string;
        referenceType: string;
        referenceId: string | null;
        issueNumber: string;
        issuedTo: string;
        issueMethod: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
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
            warehouseId: string;
            referenceType: string;
            referenceId: string | null;
            issueNumber: string;
            issuedTo: string;
            issueMethod: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: ({
            batch: {
                receivedDate: Date;
                batchNumber: string;
                lotNumber: string;
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
            unitCost: number;
            requestedQty: number;
            issuedQty: number;
            batchId: string | null;
            issueId: string;
        })[];
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
        warehouseId: string;
        referenceType: string;
        referenceId: string | null;
        issueNumber: string;
        issuedTo: string;
        issueMethod: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        issued: number;
        totalQtyIssued: number;
    }>;
}
