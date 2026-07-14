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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateProductionQcDto, req: any): Promise<{
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
    complete(id: string, dto: CompleteQcDto, req: any): Promise<{
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
}
