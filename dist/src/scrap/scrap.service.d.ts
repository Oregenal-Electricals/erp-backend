import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateScrapDto, DispositionScrapDto } from './dto/scrap.dto';
export declare class ScrapService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateScrapDto, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceQcInspection: {
            qcNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
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
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        sourceReworkId: string | null;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
    disposition(id: string, dto: DispositionScrapDto, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceQcInspection: {
            qcNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
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
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        sourceReworkId: string | null;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
    findAll(user: any, query: any): Promise<({
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceQcInspection: {
            qcNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
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
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        sourceReworkId: string | null;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceQcInspection: {
            qcNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
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
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        sourceReworkId: string | null;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
}
