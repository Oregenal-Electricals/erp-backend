import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';
export declare class DispatchConfirmationService {
    private prisma;
    private audit;
    private readiness;
    constructor(prisma: PrismaService, audit: AuditService, readiness: DispatchDocumentReadinessService);
    private generateNumber;
    private includes;
    createConfirmation(loadingId: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            reversedAt: Date | null;
            reversedBy: string | null;
            confirmedBy: string | null;
            exceptionReason: string | null;
            packageId: string;
            confirmedAt: Date;
            confirmationId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        packages: ({
            items: {
                id: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                reason: string | null;
                itemCode: string;
                itemName: string;
                saleType: string;
                reversedQty: number;
                verificationItemId: string;
                packedQty: number;
                packageId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            netWeight: number | null;
            grossWeight: number | null;
            packageNumber: string;
            packageType: string;
            packingId: string;
            assignedTransportAssignmentId: string | null;
            loadedInLoadingId: string | null;
            confirmedInConfirmationId: string | null;
            gateOutId: string | null;
        })[];
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
        };
        loading: {
            loadingNumber: string;
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
        customerName: string;
        confirmedBy: string | null;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        confirmationNumber: string;
        loadingId: string;
        confirmationType: string | null;
        confirmedAt: Date | null;
    }>;
    private revalidatePackageQuality;
    confirmPackage(confirmationId: string, packageId: string, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        reversedAt: Date | null;
        reversedBy: string | null;
        confirmedBy: string | null;
        exceptionReason: string | null;
        packageId: string;
        confirmedAt: Date;
        confirmationId: string;
    }>;
    private refreshConfirmationStatus;
    reverseConfirmationItem(itemId: string, reason: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        reversedAt: Date | null;
        reversedBy: string | null;
        confirmedBy: string | null;
        exceptionReason: string | null;
        packageId: string;
        confirmedAt: Date;
        confirmationId: string;
    }>;
    findAll(status: string | undefined, user: any): Promise<any[] | ({
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            reversedAt: Date | null;
            reversedBy: string | null;
            confirmedBy: string | null;
            exceptionReason: string | null;
            packageId: string;
            confirmedAt: Date;
            confirmationId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        packages: ({
            items: {
                id: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                reason: string | null;
                itemCode: string;
                itemName: string;
                saleType: string;
                reversedQty: number;
                verificationItemId: string;
                packedQty: number;
                packageId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            netWeight: number | null;
            grossWeight: number | null;
            packageNumber: string;
            packageType: string;
            packingId: string;
            assignedTransportAssignmentId: string | null;
            loadedInLoadingId: string | null;
            confirmedInConfirmationId: string | null;
            gateOutId: string | null;
        })[];
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
        };
        loading: {
            loadingNumber: string;
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
        customerName: string;
        confirmedBy: string | null;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        confirmationNumber: string;
        loadingId: string;
        confirmationType: string | null;
        confirmedAt: Date | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            reason: string | null;
            reversedAt: Date | null;
            reversedBy: string | null;
            confirmedBy: string | null;
            exceptionReason: string | null;
            packageId: string;
            confirmedAt: Date;
            confirmationId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        packages: ({
            items: {
                id: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                reason: string | null;
                itemCode: string;
                itemName: string;
                saleType: string;
                reversedQty: number;
                verificationItemId: string;
                packedQty: number;
                packageId: string;
            }[];
        } & {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            netWeight: number | null;
            grossWeight: number | null;
            packageNumber: string;
            packageType: string;
            packingId: string;
            assignedTransportAssignmentId: string | null;
            loadedInLoadingId: string | null;
            confirmedInConfirmationId: string | null;
            gateOutId: string | null;
        })[];
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
        };
        loading: {
            loadingNumber: string;
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
        customerName: string;
        confirmedBy: string | null;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        confirmationNumber: string;
        loadingId: string;
        confirmationType: string | null;
        confirmedAt: Date | null;
    }>;
}
