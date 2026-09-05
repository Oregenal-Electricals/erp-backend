import { ScrapService } from './scrap.service';
import { CreateScrapDto, DispositionScrapDto } from './dto/scrap.dto';
export declare class ScrapController {
    private scrapService;
    constructor(scrapService: ScrapService);
    findAll(req: any, query: any): Promise<({
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
        };
        sourceQcInspection: {
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
        sourceReworkId: string | null;
        defectDescription: string | null;
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
        };
        sourceQcInspection: {
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
        sourceReworkId: string | null;
        defectDescription: string | null;
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
    create(dto: CreateScrapDto, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
        };
        sourceQcInspection: {
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
        sourceReworkId: string | null;
        defectDescription: string | null;
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
    disposition(id: string, dto: DispositionScrapDto, req: any): Promise<{
        workOrder: {
            productCode: string;
            productName: string;
            woNumber: string;
        };
        sourceRework: {
            reworkNumber: string;
            cycleNumber: number;
        };
        sourceQcInspection: {
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
        sourceReworkId: string | null;
        defectDescription: string | null;
        scrapQty: number;
        rejectionNumber: string;
        sourceQcInspectionId: string;
        recoveryQty: number;
        otherDispositionQty: number;
        estimatedScrapValue: number;
        recognizedScrapRecovery: number;
        recoveredComponents: string | null;
    }>;
}
