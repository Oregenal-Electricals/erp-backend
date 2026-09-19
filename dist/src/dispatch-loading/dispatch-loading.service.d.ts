import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class DispatchLoadingService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    private checkVehicleMatch;
    startLoading(transportAssignmentId: string, actualVehicleNumber: string | undefined, user: any): Promise<{
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
            exceptionReason: string | null;
            packageId: string;
            loadingId: string;
            loadedBy: string | null;
            loadedAt: Date;
            unloadedBy: string | null;
            unloadedAt: Date | null;
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
        completedAt: Date | null;
        soId: string;
        startedBy: string | null;
        dispatchPlanId: string;
        loadingNumber: string;
        transportAssignmentId: string;
        startedAt: Date | null;
        completedBy: string | null;
    }>;
    private revalidatePackageQuality;
    loadPackage(loadingId: string, packageId: string, actualVehicleNumber: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        exceptionReason: string | null;
        packageId: string;
        loadingId: string;
        loadedBy: string | null;
        loadedAt: Date;
        unloadedBy: string | null;
        unloadedAt: Date | null;
    }>;
    private refreshLoadingStatus;
    unloadPackage(loadingItemId: string, reason: string | undefined, user: any): Promise<{
        id: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        reason: string | null;
        exceptionReason: string | null;
        packageId: string;
        loadingId: string;
        loadedBy: string | null;
        loadedAt: Date;
        unloadedBy: string | null;
        unloadedAt: Date | null;
    }>;
    completeLoading(loadingId: string, user: any): Promise<{
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
            exceptionReason: string | null;
            packageId: string;
            loadingId: string;
            loadedBy: string | null;
            loadedAt: Date;
            unloadedBy: string | null;
            unloadedAt: Date | null;
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
        completedAt: Date | null;
        soId: string;
        startedBy: string | null;
        dispatchPlanId: string;
        loadingNumber: string;
        transportAssignmentId: string;
        startedAt: Date | null;
        completedBy: string | null;
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
            status: string;
            reason: string | null;
            exceptionReason: string | null;
            packageId: string;
            loadingId: string;
            loadedBy: string | null;
            loadedAt: Date;
            unloadedBy: string | null;
            unloadedAt: Date | null;
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
        completedAt: Date | null;
        soId: string;
        startedBy: string | null;
        dispatchPlanId: string;
        loadingNumber: string;
        transportAssignmentId: string;
        startedAt: Date | null;
        completedBy: string | null;
    }>;
}
