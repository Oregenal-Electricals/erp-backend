import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionQcDto, CompleteQcDto, DecideQcDto } from './dto/production-qc.dto';
import { WorkOrderService } from '../work-orders/work-order.service';
export declare class ProductionQcService {
    private prisma;
    private audit;
    private workOrderService;
    constructor(prisma: PrismaService, audit: AuditService, workOrderService: WorkOrderService);
    private generateNumber;
    private includes;
    create(dto: CreateProductionQcDto, user: any): Promise<{
        passRate: number;
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        productionEntry: {
            shift: string;
            goodQty: number;
            entryNumber: string;
        };
        result: string;
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
        acceptedQty: number;
        sampleSize: number;
        workOrderId: string;
        qcNumber: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        inspectionDate: Date;
        passQty: number;
        failQty: number;
        reworkQty: number;
        holdQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
    }>;
    complete(id: string, dto: CompleteQcDto, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        productionEntry: {
            shift: string;
            goodQty: number;
            entryNumber: string;
        };
    } & {
        result: string;
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
        acceptedQty: number;
        sampleSize: number;
        workOrderId: string;
        qcNumber: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        inspectionDate: Date;
        passQty: number;
        failQty: number;
        reworkQty: number;
        holdQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
    }>;
    decideQuantities(id: string, dto: DecideQcDto, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        productionEntry: {
            shift: string;
            goodQty: number;
            entryNumber: string;
        };
    } & {
        result: string;
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
        acceptedQty: number;
        sampleSize: number;
        workOrderId: string;
        qcNumber: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        inspectionDate: Date;
        passQty: number;
        failQty: number;
        reworkQty: number;
        holdQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                productCode: string;
                productName: string;
                woNumber: string;
            };
            productionEntry: {
                shift: string;
                goodQty: number;
                entryNumber: string;
            };
        } & {
            result: string;
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
            acceptedQty: number;
            sampleSize: number;
            workOrderId: string;
            qcNumber: string;
            productionEntryId: string | null;
            inspectionStage: string;
            inspectorName: string | null;
            inspectionDate: Date;
            passQty: number;
            failQty: number;
            reworkQty: number;
            holdQty: number;
            defectDescription: string | null;
            correctiveAction: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        productionEntry: {
            shift: string;
            goodQty: number;
            entryNumber: string;
        };
    } & {
        result: string;
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
        acceptedQty: number;
        sampleSize: number;
        workOrderId: string;
        qcNumber: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        inspectionDate: Date;
        passQty: number;
        failQty: number;
        reworkQty: number;
        holdQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        pending: number;
        completed: number;
        passed: number;
        failed: number;
        conditional: number;
        passRate: number;
        totalSampled: number;
    }>;
}
