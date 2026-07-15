import { ProductionQcService } from './production-qc.service';
import { CreateProductionQcDto, CompleteQcDto } from './dto/production-qc.dto';
export declare class ProductionQcController {
    private readonly pqcService;
    constructor(pqcService: ProductionQcService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        completed: number;
        passed: number;
        failed: number;
        conditional: number;
        passRate: number;
        totalSampled: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
            qcNumber: string;
            inspectionStage: string;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            defectDescription: string | null;
            correctiveAction: string | null;
            productionEntryId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
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
        qcNumber: string;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        productionEntryId: string | null;
    }>;
    create(dto: CreateProductionQcDto, req: any): Promise<{
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
        qcNumber: string;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        productionEntryId: string | null;
    }>;
    complete(id: string, dto: CompleteQcDto, req: any): Promise<{
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
        qcNumber: string;
        inspectionStage: string;
        inspectorName: string | null;
        sampleSize: number;
        passQty: number;
        failQty: number;
        defectDescription: string | null;
        correctiveAction: string | null;
        productionEntryId: string | null;
    }>;
}
