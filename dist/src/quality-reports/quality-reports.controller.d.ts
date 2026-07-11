import { QualityReportsService } from './quality-reports.service';
export declare class QualityReportsController {
    private readonly qrService;
    constructor(qrService: QualityReportsService);
    getNcrReport(req: any, query: any): Promise<{
        data: {
            agingDays: number;
            closedDays: number;
            totalCapas: number;
            verifiedCapas: number;
            capaRecords: {
                id: string;
                status: string;
            }[];
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            itemCode: string | null;
            itemName: string | null;
            severity: string;
            qtyAffected: number;
            closedDate: Date | null;
            closedBy: string | null;
            ncrNumber: string;
            source: string;
            sourceReferenceId: string | null;
            sourceReferenceNumber: string | null;
            workOrderId: string | null;
            detectedBy: string | null;
            detectedDate: Date;
            disposition: string | null;
        }[];
        total: number;
        byStatus: {
            label: string;
            count: number;
        }[];
        bySeverity: {
            label: string;
            count: number;
        }[];
        bySource: {
            label: string;
            count: number;
        }[];
        avgClosingDays: number;
    }>;
    getCapaReport(req: any, query: any): Promise<{
        data: {
            isOverdue: boolean;
            daysToComplete: number;
            ncr: {
                severity: string;
                ncrNumber: string;
                source: string;
            };
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
            assignedTo: string | null;
            rootCause: string | null;
            correctiveAction: string;
            dueDate: Date;
            capaNumber: string;
            ncrId: string;
            preventiveAction: string | null;
            completedDate: Date | null;
            effectivenessCheck: string | null;
            verifiedBy: string | null;
            verifiedDate: Date | null;
        }[];
        total: number;
        completionRate: number;
        overdueCount: number;
        avgCompletionDays: number;
        byStatus: {
            label: string;
            count: number;
        }[];
    }>;
    getOqcReport(req: any, query: any): Promise<{
        data: ({
            workOrder: {
                woNumber: string;
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
            result: string;
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            customerName: string | null;
            batchNumber: string | null;
            workOrderId: string | null;
            releasedBy: string | null;
            releasedDate: Date | null;
            oqcNumber: string;
            fgReceiptId: string | null;
            lotNumber: string | null;
            inspectionDate: Date;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            visualCheck: string | null;
            dimensionalCheck: string | null;
            functionalCheck: string | null;
            packagingCheck: string | null;
            labellingCheck: string | null;
            defectsFound: string | null;
            cocNumber: string | null;
        })[];
        total: number;
        totalSampled: number;
        totalPassed: number;
        totalFailed: number;
        overallPassRate: number;
        byResult: {
            label: string;
            count: number;
        }[];
        byItem: any[];
    }>;
    getSupplierReport(req: any, query: any): Promise<{
        ratings: ({
            vendor: {
                code: string;
                name: string;
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
            remarks: string | null;
            rating: string;
            vendorId: string;
            period: string;
            periodType: string;
            totalReceived: number;
            totalRejected: number;
            defectRate: number;
            ncrCount: number;
            carCount: number;
            onTimeDelivery: number;
            qualityScore: number;
            avlStatus: string;
        })[];
        totalRatings: number;
        blacklisted: number;
        probation: number;
        avgScore: number;
        cars: ({
            vendor: {
                code: string;
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            severity: string;
            closedDate: Date | null;
            vendorId: string;
            dueDate: Date;
            ncrId: string | null;
            verifiedBy: string | null;
            verifiedDate: Date | null;
            carNumber: string;
            supplierResponse: string | null;
            supplierRootCause: string | null;
            supplierAction: string | null;
            respondedDate: Date | null;
        })[];
        totalCars: number;
        openCars: number;
    }>;
    getComplaintReport(req: any, query: any): Promise<{
        data: {
            responseDays: number;
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            remarks: string | null;
            itemCode: string;
            itemName: string;
            severity: string;
            customerPo: string | null;
            customerName: string;
            complaintNumber: string;
            customerId: string | null;
            invoiceNumber: string | null;
            batchNumber: string | null;
            complaintDate: Date;
            receivedDate: Date;
            complaintType: string;
            qtyAffected: number;
            customerRequest: string | null;
            assignedTo: string | null;
            eighthDNumber: string | null;
            rootCause: string | null;
            correctiveAction: string | null;
            responseDate: Date | null;
            closedDate: Date | null;
            closedBy: string | null;
        }[];
        total: number;
        byType: {
            label: string;
            count: number;
        }[];
        bySeverity: {
            label: string;
            count: number;
        }[];
        byStatus: {
            label: string;
            count: number;
        }[];
        avgResponseDays: number;
        closureRate: number;
    }>;
    getKpiSummary(req: any): Promise<{
        generatedAt: Date;
        ncr: {
            total: number;
            open: number;
            closed: number;
            closureRate: number;
        };
        capa: {
            total: number;
            verified: number;
            overdue: number;
            effectivenessRate: number;
        };
        oqc: {
            passRate: number;
            totalSampled: number;
        };
        complaints: {
            total: number;
            closed: number;
            closureRate: number;
        };
        supplier: {
            totalRated: number;
            avgScore: number;
            blacklisted: number;
        };
    }>;
}
