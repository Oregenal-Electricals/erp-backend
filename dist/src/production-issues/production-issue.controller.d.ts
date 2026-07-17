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
            issueMethod: string;
            issueNumber: string;
            workOrderId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    create(dto: CreateProductionIssueDto, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    createFromMrp(woId: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
    confirm(id: string, req: any): Promise<{
        items: ({
            batch: {
                lotNumber: string;
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
        issueMethod: string;
        issueNumber: string;
        workOrderId: string;
    }>;
}
