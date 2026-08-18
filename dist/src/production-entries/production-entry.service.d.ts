import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { MaterialReservationService } from '../work-orders/material-reservation.service';
import { CreateProductionEntryDto } from './dto/production-entry.dto';
export declare class ProductionEntryService {
    private prisma;
    private audit;
    private materialReservation;
    constructor(prisma: PrismaService, audit: AuditService, materialReservation: MaterialReservationService);
    private generateNumber;
    private includes;
    create(dto: CreateProductionEntryDto, user: any): Promise<{
        workOrder: {
            status: string;
            productCode: string;
            productName: string;
            woNumber: string;
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
        status: string;
        remarks: string | null;
        workOrderId: string;
        totalQty: number;
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
            woNumber: string;
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
        status: string;
        remarks: string | null;
        workOrderId: string;
        totalQty: number;
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
                woNumber: string;
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
            status: string;
            remarks: string | null;
            workOrderId: string;
            totalQty: number;
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
            woNumber: string;
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
        status: string;
        remarks: string | null;
        workOrderId: string;
        totalQty: number;
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
            stageName: string | null;
            productCode: string;
            productName: string;
            bomId: string | null;
            rejectedQty: number;
            woNumber: string;
            salesOrderId: string | null;
            routingGroupId: string | null;
            stageSequence: number | null;
            parentWorkOrderId: string | null;
            plannedQty: number;
            pendingReassignQty: number | null;
            completedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
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
            workOrderId: string;
            totalQty: number;
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
