import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';
export declare class ProductionEntryService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateProductionEntryDto, user: any): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        shift: string;
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
    confirm(id: string, user: any): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        shift: string;
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
    findAll(user: any, query: any): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            shift: string;
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
    findOne(id: string, user: any): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        shift: string;
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
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        confirmed: number;
        totalGoodQty: number;
        totalScrapQty: number;
        totalQty: number;
    }>;
    getWoProgress(workOrderId: string, user: any): Promise<{
        workOrder: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            shift: string;
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
}
