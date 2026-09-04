import { ReworkService } from './rework.service';
import { CreateReworkDto, StartReworkDto, CompleteReworkDto } from './dto/rework.dto';
export declare class ReworkController {
    private reworkService;
    constructor(reworkService: ReworkService);
    findAll(req: any, query: any): Promise<({
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        originalQcInspection: {
            qcNumber: string;
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
        quantity: number;
        workOrderId: string;
        defectDescription: string | null;
        manpowerQty: number | null;
        originalQcInspectionId: string;
        reworkStage: string | null;
        successfullyReworkedQty: number | null;
        stillDefectiveQty: number | null;
        additionalMaterialCost: number;
        additionalOtherCost: number;
        reworkNumber: string;
        remainingQuantity: number;
        cycleNumber: number;
        actualStartAt: Date | null;
        actualEndAt: Date | null;
        additionalLabourCost: number;
        totalAdditionalCost: number;
    })[]>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        originalQcInspection: {
            qcNumber: string;
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
        quantity: number;
        workOrderId: string;
        defectDescription: string | null;
        manpowerQty: number | null;
        originalQcInspectionId: string;
        reworkStage: string | null;
        successfullyReworkedQty: number | null;
        stillDefectiveQty: number | null;
        additionalMaterialCost: number;
        additionalOtherCost: number;
        reworkNumber: string;
        remainingQuantity: number;
        cycleNumber: number;
        actualStartAt: Date | null;
        actualEndAt: Date | null;
        additionalLabourCost: number;
        totalAdditionalCost: number;
    }>;
    create(dto: CreateReworkDto, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        originalQcInspection: {
            qcNumber: string;
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
        quantity: number;
        workOrderId: string;
        defectDescription: string | null;
        manpowerQty: number | null;
        originalQcInspectionId: string;
        reworkStage: string | null;
        successfullyReworkedQty: number | null;
        stillDefectiveQty: number | null;
        additionalMaterialCost: number;
        additionalOtherCost: number;
        reworkNumber: string;
        remainingQuantity: number;
        cycleNumber: number;
        actualStartAt: Date | null;
        actualEndAt: Date | null;
        additionalLabourCost: number;
        totalAdditionalCost: number;
    }>;
    start(id: string, dto: StartReworkDto, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        originalQcInspection: {
            qcNumber: string;
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
        quantity: number;
        workOrderId: string;
        defectDescription: string | null;
        manpowerQty: number | null;
        originalQcInspectionId: string;
        reworkStage: string | null;
        successfullyReworkedQty: number | null;
        stillDefectiveQty: number | null;
        additionalMaterialCost: number;
        additionalOtherCost: number;
        reworkNumber: string;
        remainingQuantity: number;
        cycleNumber: number;
        actualStartAt: Date | null;
        actualEndAt: Date | null;
        additionalLabourCost: number;
        totalAdditionalCost: number;
    }>;
    complete(id: string, dto: CompleteReworkDto, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        originalQcInspection: {
            qcNumber: string;
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
        quantity: number;
        workOrderId: string;
        defectDescription: string | null;
        manpowerQty: number | null;
        originalQcInspectionId: string;
        reworkStage: string | null;
        successfullyReworkedQty: number | null;
        stillDefectiveQty: number | null;
        additionalMaterialCost: number;
        additionalOtherCost: number;
        reworkNumber: string;
        remainingQuantity: number;
        cycleNumber: number;
        actualStartAt: Date | null;
        actualEndAt: Date | null;
        additionalLabourCost: number;
        totalAdditionalCost: number;
    }>;
}
