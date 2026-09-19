import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
export declare class DispatchGateOutService {
    private prisma;
    private audit;
    private readiness;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, readiness: DispatchDocumentReadinessService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    private revalidatePackageQuality;
    confirmGateOut(dispatchConfirmationId: string, actualVehicleNumber: string | undefined, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            qty: number;
            warehouseId: string | null;
            saleType: string;
            soItemId: string;
            workOrderId: string | null;
            dispatchReservationId: string | null;
            gateOutId: string;
            packageId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        dispatchConfirmation: {
            confirmationNumber: string;
            confirmationType: string;
        };
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        gateOutNumber: string;
        dispatchConfirmationId: string;
        gateOutAt: Date;
        gateOutBy: string | null;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            qty: number;
            warehouseId: string | null;
            saleType: string;
            soItemId: string;
            workOrderId: string | null;
            dispatchReservationId: string | null;
            gateOutId: string;
            packageId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        dispatchConfirmation: {
            confirmationNumber: string;
            confirmationType: string;
        };
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        gateOutNumber: string;
        dispatchConfirmationId: string;
        gateOutAt: Date;
        gateOutBy: string | null;
    }>;
}
