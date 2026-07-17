import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateProductionQcDto, CompleteQcDto } from './dto/production-qc.dto';
export declare class ProductionQcService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateProductionQcDto, user: any): Promise<{
        passRate: number;
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        inspectionDate: Date;
        workOrderId: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        qcNumber: string;
    }>;
    complete(id: string, dto: CompleteQcDto, user: any): Promise<{
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        inspectionDate: Date;
        workOrderId: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        qcNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            workOrder: {
                woNumber: string;
                productCode: string;
                productName: string;
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
            inspectionDate: Date;
            workOrderId: string;
            productionEntryId: string | null;
            inspectionStage: string;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            defectDescription: string | null;
            correctiveAction: string | null;
            qcNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        workOrder: {
            woNumber: string;
            productCode: string;
            productName: string;
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
        inspectionDate: Date;
        workOrderId: string;
        productionEntryId: string | null;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        qcNumber: string;
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
