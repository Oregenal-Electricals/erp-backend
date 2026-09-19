import { DispatchConfirmationService } from './dispatch-confirmation.service';
import { CreateConfirmationDto, ConfirmPackageDto, ReverseConfirmationDto } from './dto/dispatch-confirmation.dto';
export declare class DispatchConfirmationController {
    private readonly confirmationService;
    constructor(confirmationService: DispatchConfirmationService);
    findAll(status: string, req: any): Promise<any[] | ({
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
    createConfirmation(dto: CreateConfirmationDto, req: any): Promise<{
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
    confirmPackage(id: string, dto: ConfirmPackageDto, req: any): Promise<{
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
    reverseConfirmationItem(itemId: string, dto: ReverseConfirmationDto, req: any): Promise<{
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
}
