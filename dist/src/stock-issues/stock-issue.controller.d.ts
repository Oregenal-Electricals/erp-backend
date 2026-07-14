import { StockIssueService } from './stock-issue.service';
import { CreateStockIssueDto } from './dto/stock-issue.dto';
export declare class StockIssueController {
    private readonly siService;
    constructor(siService: StockIssueService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        issued: number;
        totalQtyIssued: number;
    }>;
    getFifoPlan(q: any, req: any): Promise<{
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
    findAll(req: any, query: any): Promise<{
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
            issuedTo: string;
            issueMethod: string;
            issueNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: ({
            batch: {
                receivedDate: Date;
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
        issuedTo: string;
        issueMethod: string;
        issueNumber: string;
    }>;
    create(dto: CreateStockIssueDto, req: any): Promise<{
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
        issuedTo: string;
        issueMethod: string;
        issueNumber: string;
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
        issuedTo: string;
        issueMethod: string;
        issueNumber: string;
    }>;
}
