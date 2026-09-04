import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateReworkDto, StartReworkDto, CompleteReworkDto } from './dto/rework.dto';
export declare class ReworkService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
    private generateNumber;
    private includes;
    create(dto: CreateReworkDto, user: any): Promise<{
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
    start(id: string, dto: StartReworkDto, user: any): Promise<{
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
    complete(id: string, dto: CompleteReworkDto, user: any): Promise<{
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
    findAll(user: any, query: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
