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
            remarks: string | null;
            warehouseId: string;
            woNumber: string;
            productCode: string;
            productName: string;
            uom: string;
            bomId: string | null;
            plannedQty: number;
            completedQty: number;
            rejectedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            priority: string;
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
            machineName: string | null;
            status: string;
            remarks: string | null;
            workOrderId: string;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            goodQty: number;
            scrapQty: number;
            totalQty: number;
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
                woNumber: string;
                productCode: string;
                productName: string;
                plannedQty: number;
                completedQty: number;
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
            machineName: string | null;
            status: string;
            remarks: string | null;
            workOrderId: string;
            entryNumber: string;
            entryDate: Date;
            operatorName: string | null;
            goodQty: number;
            scrapQty: number;
            totalQty: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            status: string;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
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
        machineName: string | null;
        status: string;
        remarks: string | null;
        workOrderId: string;
        entryNumber: string;
        entryDate: Date;
        operatorName: string | null;
        goodQty: number;
        scrapQty: number;
        totalQty: number;
    }>;
    create(dto: CreateProductionEntryDto, req: any): Promise<{
        workOrder: {
            status: string;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
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
        machineName: string | null;
        status: string;
        remarks: string | null;
        workOrderId: string;
        entryNumber: string;
        entryDate: Date;
        operatorName: string | null;
        goodQty: number;
        scrapQty: number;
        totalQty: number;
    }>;
    confirm(id: string, req: any): Promise<{
        workOrder: {
            status: string;
            woNumber: string;
            productCode: string;
            productName: string;
            plannedQty: number;
            completedQty: number;
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
        machineName: string | null;
        status: string;
        remarks: string | null;
        workOrderId: string;
        entryNumber: string;
        entryDate: Date;
        operatorName: string | null;
        goodQty: number;
        scrapQty: number;
        totalQty: number;
    }>;
}
