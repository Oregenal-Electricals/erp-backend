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
                productName: string;
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
    create(dto: CreateProductionIssueDto, req: any): Promise<{
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
    createFromMrp(woId: string, req: any): Promise<{
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
    confirm(id: string, req: any): Promise<{
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
}
