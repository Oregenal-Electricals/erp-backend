import { ProductionEntryService } from './production-entry.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';
export declare class ProductionEntryController {
    private readonly peService;
    constructor(peService: ProductionEntryService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        confirmed: number;
        totalGoodQty: number;
        totalScrapQty: number;
        totalQty: number;
    }>;
    getWoProgress(woId: string, req: any): Promise<{
        workOrder: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            priority: string;
            remarks: string | null;
            uom: string;
            warehouseId: string;
            bomId: string | null;
            rejectedQty: number;
            productCode: string;
            productName: string;
            plannedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            completedQty: number;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            woNumber: string;
        };
        entries: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            shift: string;
            status: string;
            remarks: string | null;
            totalQty: number;
            workOrderId: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
        }[];
        summary: {
            plannedQty: number;
            confirmedGoodQty: number;
            confirmedScrapQty: number;
            pendingQty: number;
            completionPercent: number;
            totalEntries: number;
        };
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                status: string;
                productCode: string;
                productName: string;
                plannedQty: number;
                completedQty: number;
                woNumber: string;
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
            shift: string;
            status: string;
            remarks: string | null;
            totalQty: number;
            workOrderId: string;
            entryDate: Date;
            operatorName: string | null;
            machineName: string | null;
            goodQty: number;
            scrapQty: number;
            entryNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            status: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        shift: string;
        status: string;
        remarks: string | null;
        totalQty: number;
        workOrderId: string;
        entryDate: Date;
        operatorName: string | null;
        machineName: string | null;
        goodQty: number;
        scrapQty: number;
        entryNumber: string;
    }>;
    create(dto: CreateProductionEntryDto, req: any): Promise<{
        workOrder: {
            status: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        shift: string;
        status: string;
        remarks: string | null;
        totalQty: number;
        workOrderId: string;
        entryDate: Date;
        operatorName: string | null;
        machineName: string | null;
        goodQty: number;
        scrapQty: number;
        entryNumber: string;
    }>;
    confirm(id: string, req: any): Promise<{
        workOrder: {
            status: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
            woNumber: string;
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
        shift: string;
        status: string;
        remarks: string | null;
        totalQty: number;
        workOrderId: string;
        entryDate: Date;
        operatorName: string | null;
        machineName: string | null;
        goodQty: number;
        scrapQty: number;
        entryNumber: string;
    }>;
}
