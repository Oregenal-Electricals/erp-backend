import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { DispatchDocumentReadinessService } from '../dispatch-document-readiness/dispatch-document-readiness.service';
export declare class DispatchTransportService {
    private prisma;
    private audit;
    private readiness;
    constructor(prisma: PrismaService, audit: AuditService, readiness: DispatchDocumentReadinessService);
    private generateNumber;
    private includes;
    createAssignment(dto: any, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    assignPackage(assignmentId: string, packageId: string, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    unassignPackage(assignmentId: string, packageId: string, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    confirmAssignment(assignmentId: string, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    reassignVehicle(assignmentId: string, dto: any, user: any): Promise<{
        documentRecheckRequired: boolean;
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    cancelAssignment(assignmentId: string, reason: string | undefined, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
    checkReadyForLoading(assignmentId: string, user: any): Promise<{
        assignmentId: string;
        assignmentNumber: string;
        readyForLoading: boolean;
        reasons: string[];
        documentReadiness: {
            dispatchPlanId: string;
            planNumber: string;
            soNumber: string;
            customerName: string;
            invoice: {
                status: string;
                reason: string;
                invoiceNumber: string;
                invoiceStatusRaw: string;
            };
            challan: {
                status: string;
                reason: string;
            };
            ewayBill: {
                status: string;
                reason: string;
                ewayBillNumber: string;
            };
            eInvoiceIrn: {
                status: string;
                reason: string;
            };
            overall: string;
            checkedBy: any;
            checkedAt: string;
        };
        loadedQty: number;
    }>;
    findOne(id: string, user: any): Promise<{
        vehicle: {
            vehicleNumber: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            isCompanyVehicle: boolean;
        };
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
        })[];
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
        vehicleType: string | null;
        remarks: string | null;
        vehicleId: string | null;
        driverName: string | null;
        customerName: string;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        dispatchPlanId: string;
        assignmentNumber: string;
        transportType: string;
        lrNumber: string | null;
    }>;
}
