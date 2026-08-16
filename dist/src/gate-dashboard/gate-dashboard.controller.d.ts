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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            status: import(".prisma/client").$Enums.VisitorStatus;
            remarks: string | null;
            vehicleNumber: string | null;
            plantId: string;
            logNumber: string;
            visitorId: string;
            hostEmployeeId: string | null;
            checkedInById: string;
            checkedOutById: string | null;
            purpose: string;
            itemsCarried: string | null;
            areasToVisit: string | null;
            checkInTime: Date;
            checkOutTime: Date | null;
            expectedOutTime: Date | null;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            status: import(".prisma/client").$Enums.VehicleLogStatus;
            remarks: string | null;
            customerName: string | null;
            driverName: string;
            poNumber: string | null;
            plantId: string;
            logNumber: string;
            purpose: import(".prisma/client").$Enums.VehiclePurpose;
            vehicleId: string;
            driverMobile: string | null;
            driverLicense: string | null;
            inWeight: number | null;
            outWeight: number | null;
            netWeight: number | null;
            materialDescription: string | null;
            supplierName: string | null;
            entryTime: Date;
            exitTime: Date | null;
            expectedExitTime: Date | null;
            entryById: string;
            exitById: string | null;
        })[];
        pendingGINList: ({
            plant: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            status: import(".prisma/client").$Enums.GateInwardStatus;
            remarks: string | null;
            unit: string;
            invoiceNumber: string | null;
            poNumber: string | null;
            poId: string | null;
            rejectionReason: string | null;
            invoiceDate: Date | null;
            plantId: string;
            verifiedAt: Date | null;
            quantity: number | null;
            netWeight: number | null;
            materialDescription: string | null;
            supplierName: string;
            ginNumber: string;
            vehicleLogId: string | null;
            supplierMobile: string | null;
            supplierGstin: string | null;
            invoiceAmount: number | null;
            grossWeight: number | null;
            packageCount: number | null;
            receivedById: string;
            verifiedById: string | null;
            completedAt: Date | null;
        })[];
        pendingGOEList: ({
            plant: {
                name: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            status: import(".prisma/client").$Enums.GateOutwardStatus;
            remarks: string | null;
            unit: string;
            customerName: string;
            cancelReason: string | null;
            invoiceNumber: string | null;
            customerAddress: string | null;
            plantId: string;
            quantity: number;
            netWeight: number | null;
            materialDescription: string;
            vehicleLogId: string | null;
            invoiceAmount: number | null;
            grossWeight: number | null;
            packageCount: number | null;
            goeNumber: string;
            customerMobile: string | null;
            customerGstin: string | null;
            salesOrderNumber: string | null;
            deliveryChallanNumber: string | null;
            authorizedById: string | null;
            authorizedAt: Date | null;
            dispatchedById: string | null;
            dispatchedAt: Date | null;
            createdById: string;
        })[];
        pendingPassList: ({
            employee: {
                firstName: string;
                lastName: string;
            };
            plant: {
                name: string;
            };
            requestedBy: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            updatedBy: string;
            isActive: boolean;
            isTestData: boolean;
            type: import(".prisma/client").$Enums.GatePassType;
            status: import(".prisma/client").$Enums.GatePassStatus;
            employeeId: string | null;
            remarks: string | null;
            unit: string;
            cancelReason: string | null;
            vehicleNumber: string | null;
            closedAt: Date | null;
            plantId: string;
            estimatedValue: number | null;
            quantity: number;
            carrierName: string;
            validFrom: Date | null;
            validTo: Date | null;
            purpose: string;
            passNumber: string;
            authorizedById: string | null;
            authorizedAt: Date | null;
            carrierMobile: string | null;
            carrierIdProof: string | null;
            itemDescription: string;
            returnedAt: Date | null;
            exitType: string | null;
            expectedReturnTime: Date | null;
            actualReturnTime: Date | null;
            departmentName: string | null;
            requestedById: string;
            issuedById: string | null;
            issuedAt: Date | null;
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
