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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
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
        issueNumber: string;
        issueMethod: string;
        workOrderId: string;
    }>;
    create(dto: CreateProductionIssueDto, user: any): Promise<{
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
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
        issueNumber: string;
        issueMethod: string;
        workOrderId: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
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
        issueNumber: string;
        issueMethod: string;
        workOrderId: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            warehouse: {
                name: string;
            };
            workOrder: {
                woNumber: string;
                productName: string;
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
            issueNumber: string;
            issueMethod: string;
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
            requiredQty: number;
            issuedQty: number;
            batchId: string | null;
            productionIssueId: string;
        })[];
        warehouse: {
            name: string;
            code: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
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
        issueNumber: string;
        issueMethod: string;
        workOrderId: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        issued: number;
        totalQtyIssued: number;
    }>;
}
