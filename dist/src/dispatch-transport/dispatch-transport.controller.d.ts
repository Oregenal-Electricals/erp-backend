import { DispatchTransportService } from './dispatch-transport.service';
import { CreateTransportAssignmentDto, AssignPackageDto, ReassignVehicleDto, CancelAssignmentDto } from './dto/dispatch-transport.dto';
export declare class DispatchTransportController {
    private readonly transportService;
    constructor(transportService: DispatchTransportService);
    findOne(id: string, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    checkReadyForLoading(id: string, req: any): Promise<{
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
    createAssignment(dto: CreateTransportAssignmentDto, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    assignPackage(id: string, dto: AssignPackageDto, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    unassignPackage(id: string, packageId: string, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    confirmAssignment(id: string, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    reassignVehicle(id: string, dto: ReassignVehicleDto, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
    cancelAssignment(id: string, dto: CancelAssignmentDto, req: any): Promise<{
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
            loadedInLoadingId: string | null;
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
