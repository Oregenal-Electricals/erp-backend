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
    findOne(id: string, req: any): Promise<{
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
    create(dto: CreateScrapDto, req: any): Promise<{
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
    disposition(id: string, dto: DispositionScrapDto, req: any): Promise<{
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
