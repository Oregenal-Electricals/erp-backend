import { GateDashboardService } from './gate-dashboard.service';
export declare class GateDashboardController {
    private readonly service;
    constructor(service: GateDashboardService);
    getSummary(user: any): Promise<{
        liveStats: {
            visitorsInside: number;
            vehiclesInside: number;
            todayVisitors: number;
            todayVehicles: number;
            pendingGINs: number;
            pendingGOEs: number;
            pendingPasses: number;
            issuedPasses: number;
            yesterdayVisitors: number;
            yesterdayVehicles: number;
            returnableOverdue: number;
        };
        activeVisitors: ({
            plant: {
                name: string;
            };
            visitor: {
                firstName: string;
                lastName: string;
                mobile: string;
                visitorCompany: string;
            };
            hostEmployee: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            plantId: string;
            status: import(".prisma/client").$Enums.VisitorStatus;
            visitorId: string;
            hostEmployeeId: string | null;
            purpose: string;
            vehicleNumber: string | null;
            itemsCarried: string | null;
            areasToVisit: string | null;
            expectedOutTime: Date | null;
            remarks: string | null;
            checkInTime: Date;
            logNumber: string;
            checkedInById: string;
            checkedOutById: string | null;
            checkOutTime: Date | null;
            passNumber: string | null;
        })[];
        activeVehicles: ({
            plant: {
                name: string;
            };
            vehicle: {
                vehicleNumber: string;
                vehicleType: import(".prisma/client").$Enums.VehicleType;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            plantId: string;
            status: import(".prisma/client").$Enums.VehicleLogStatus;
            purpose: import(".prisma/client").$Enums.VehiclePurpose;
            remarks: string | null;
            logNumber: string;
            vehicleId: string;
            driverName: string;
            driverMobile: string | null;
            driverLicense: string | null;
            inWeight: number | null;
            materialDescription: string | null;
            supplierName: string | null;
            customerName: string | null;
            poNumber: string | null;
            expectedExitTime: Date | null;
            outWeight: number | null;
            entryTime: Date;
            netWeight: number | null;
            exitTime: Date | null;
            entryById: string;
            exitById: string | null;
        })[];
        pendingGINList: ({
            plant: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            plantId: string;
            unit: string;
            status: import(".prisma/client").$Enums.GateInwardStatus;
            remarks: string | null;
            materialDescription: string;
            supplierName: string;
            poNumber: string | null;
            netWeight: number | null;
            vehicleLogId: string | null;
            supplierMobile: string | null;
            supplierGstin: string | null;
            invoiceNumber: string | null;
            invoiceDate: Date | null;
            invoiceAmount: number | null;
            quantity: number;
            grossWeight: number | null;
            packageCount: number | null;
            rejectionReason: string | null;
            ginNumber: string;
            verifiedAt: Date | null;
            completedAt: Date | null;
            receivedById: string;
            verifiedById: string | null;
        })[];
        pendingGOEList: ({
            plant: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            plantId: string;
            unit: string;
            status: import(".prisma/client").$Enums.GateOutwardStatus;
            remarks: string | null;
            materialDescription: string;
            customerName: string;
            netWeight: number | null;
            vehicleLogId: string | null;
            invoiceNumber: string | null;
            invoiceAmount: number | null;
            quantity: number;
            grossWeight: number | null;
            packageCount: number | null;
            customerMobile: string | null;
            customerAddress: string | null;
            customerGstin: string | null;
            salesOrderNumber: string | null;
            deliveryChallanNumber: string | null;
            cancelReason: string | null;
            goeNumber: string;
            authorizedAt: Date | null;
            dispatchedAt: Date | null;
            authorizedById: string | null;
            dispatchedById: string | null;
            createdById: string;
        })[];
        pendingPassList: ({
            plant: {
                name: string;
            };
            requestedBy: {
                firstName: string;
                lastName: string;
            };
            employee: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            plantId: string;
            unit: string;
            status: import(".prisma/client").$Enums.GatePassStatus;
            type: import(".prisma/client").$Enums.GatePassType;
            requestedById: string;
            purpose: string;
            vehicleNumber: string | null;
            remarks: string | null;
            passNumber: string;
            quantity: number;
            cancelReason: string | null;
            authorizedAt: Date | null;
            authorizedById: string | null;
            carrierName: string;
            carrierMobile: string | null;
            carrierIdProof: string | null;
            itemDescription: string;
            estimatedValue: number | null;
            validFrom: Date | null;
            validTo: Date | null;
            employeeId: string | null;
            exitType: string | null;
            expectedReturnTime: Date | null;
            departmentName: string | null;
            returnedAt: Date | null;
            actualReturnTime: Date | null;
            issuedAt: Date | null;
            closedAt: Date | null;
            issuedById: string | null;
            closedById: string | null;
        })[];
        timeline: {
            type: string;
            time: Date;
            title: string;
            badge: string;
            color: string;
        }[];
    }>;
}
