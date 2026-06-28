import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { MrpService } from '../mrp/mrp.service';
import { CreateProductionIssueDto } from './dto/production-issue.dto';
export declare class ProductionIssueService {
    private prisma;
    private audit;
    private stockLedger;
    private mrpService;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService, mrpService: MrpService);
    private generateNumber;
    private includes;
    createFromMrp(workOrderId: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            woNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    create(dto: CreateProductionIssueDto, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            woNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    confirm(id: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            woNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
            };
            workOrder: {
                productName: string;
                woNumber: string;
            };
            _count: {
                items: number;
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
            issueMethod: string;
            issueNumber: string;
            workOrderId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
                batchNumber: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            productCode: string;
            productName: string;
            plannedQty: number;
            woNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        issued: number;
        totalQtyIssued: number;
    }>;
}
