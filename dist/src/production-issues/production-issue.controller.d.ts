import { ProductionIssueService } from './production-issue.service';
import { CreateProductionIssueDto } from './dto/production-issue.dto';
export declare class ProductionIssueController {
    private readonly piService;
    constructor(piService: ProductionIssueService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        issued: number;
        totalQtyIssued: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
            workOrderId: string;
            issueNumber: string;
            issueMethod: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
        };
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
            unitCost: number;
            uom: string;
            requiredQty: number;
            productionIssueId: string;
            batchId: string | null;
            issuedQty: number;
        })[];
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
        workOrderId: string;
        issueNumber: string;
        issueMethod: string;
    }>;
    create(dto: CreateProductionIssueDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
        };
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
            unitCost: number;
            uom: string;
            requiredQty: number;
            productionIssueId: string;
            batchId: string | null;
            issuedQty: number;
        })[];
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
        workOrderId: string;
        issueNumber: string;
        issueMethod: string;
    }>;
    createFromMrp(woId: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
        };
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
            unitCost: number;
            uom: string;
            requiredQty: number;
            productionIssueId: string;
            batchId: string | null;
            issuedQty: number;
        })[];
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
        workOrderId: string;
        issueNumber: string;
        issueMethod: string;
    }>;
    confirm(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
        };
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
            unitCost: number;
            uom: string;
            requiredQty: number;
            productionIssueId: string;
            batchId: string | null;
            issuedQty: number;
        })[];
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
        workOrderId: string;
        issueNumber: string;
        issueMethod: string;
    }>;
}
