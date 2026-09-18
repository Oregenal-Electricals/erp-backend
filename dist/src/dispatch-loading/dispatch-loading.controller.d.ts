import { DispatchLoadingService } from './dispatch-loading.service';
import { StartLoadingDto, LoadPackageDto, UnloadPackageDto } from './dto/dispatch-loading.dto';
export declare class DispatchLoadingController {
    private readonly loadingService;
    constructor(loadingService: DispatchLoadingService);
    findOne(id: string, req: any): Promise<{
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
    startLoading(dto: StartLoadingDto, req: any): Promise<{
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
    loadPackage(id: string, dto: LoadPackageDto, req: any): Promise<{
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
    unloadPackage(itemId: string, dto: UnloadPackageDto, req: any): Promise<{
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
    completeLoading(id: string, req: any): Promise<{
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
