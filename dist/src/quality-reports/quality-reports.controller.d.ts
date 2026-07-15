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
            closedBy: string | null;
            itemCode: string | null;
            itemName: string | null;
            disposition: string | null;
            workOrderId: string | null;
            ncrNumber: string;
            source: string;
            sourceReferenceId: string | null;
            sourceReferenceNumber: string | null;
            severity: string;
            qtyAffected: number;
            detectedBy: string | null;
            detectedDate: Date;
            closedDate: Date | null;
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
                ncrNumber: string;
                source: string;
                severity: string;
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
            dueDate: Date;
            remarks: string | null;
            verifiedBy: string | null;
            assignedTo: string | null;
            completedDate: Date | null;
            correctiveAction: string;
            capaNumber: string;
            ncrId: string;
            rootCause: string | null;
            preventiveAction: string | null;
            effectivenessCheck: string | null;
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
            customerName: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            inspectionDate: Date;
            batchNumber: string | null;
            lotNumber: string | null;
            workOrderId: string | null;
            inspectorName: string | null;
            sampleSize: number;
            passQty: number;
            failQty: number;
            oqcNumber: string;
            visualCheck: string | null;
            dimensionalCheck: string | null;
            functionalCheck: string | null;
            packagingCheck: string | null;
            labellingCheck: string | null;
            defectsFound: string | null;
            cocNumber: string | null;
            releasedBy: string | null;
            releasedDate: Date | null;
            fgReceiptId: string | null;
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
                name: string;
                code: string;
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
                name: string;
                code: string;
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
            dueDate: Date;
            remarks: string | null;
            verifiedBy: string | null;
            vendorId: string;
            severity: string;
            closedDate: Date | null;
            ncrId: string | null;
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
            customerPo: string | null;
            remarks: string | null;
            customerName: string;
            invoiceNumber: string | null;
            closedBy: string | null;
            itemCode: string;
            itemName: string;
            receivedDate: Date;
            assignedTo: string | null;
            batchNumber: string | null;
            correctiveAction: string | null;
            severity: string;
            qtyAffected: number;
            closedDate: Date | null;
            rootCause: string | null;
            complaintNumber: string;
            customerId: string | null;
            complaintDate: Date;
            complaintType: string;
            customerRequest: string | null;
            eighthDNumber: string | null;
            responseDate: Date | null;
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
