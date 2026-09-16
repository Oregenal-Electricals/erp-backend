import { VisitorStatus } from '@prisma/client';
import { VisitorManagementService } from './visitor-management.service';
import { CheckInVisitorDto, CheckOutVisitorDto } from './dto/visitor.dto';
export declare class VisitorLogController {
    private readonly service;
    constructor(service: VisitorManagementService);
    checkIn(dto: CheckInVisitorDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
        visitor: {
            id: string;
            firstName: string;
            lastName: string;
            mobile: string;
            visitorCompany: string;
            idProofType: import("@prisma/client").$Enums.IdProofType;
        };
        hostEmployee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedOutBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        vehicleNumber: string | null;
        remarks: string | null;
        purpose: string;
        logNumber: string;
        visitorId: string;
        hostEmployeeId: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        expectedOutTime: Date | null;
        checkInTime: Date;
        checkedInById: string;
        checkedOutById: string | null;
        vehicleLogId: string | null;
        checkOutTime: Date | null;
        passNumber: string | null;
    }>;
    findAllLogs(user: any, plantId?: string, status?: VisitorStatus, date?: string): Promise<({
        plant: {
            id: string;
            name: string;
            code: string;
        };
        visitor: {
            id: string;
            firstName: string;
            lastName: string;
            mobile: string;
            visitorCompany: string;
            idProofType: import("@prisma/client").$Enums.IdProofType;
        };
        hostEmployee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedOutBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        vehicleNumber: string | null;
        remarks: string | null;
        purpose: string;
        logNumber: string;
        visitorId: string;
        hostEmployeeId: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        expectedOutTime: Date | null;
        checkInTime: Date;
        checkedInById: string;
        checkedOutById: string | null;
        vehicleLogId: string | null;
        checkOutTime: Date | null;
        passNumber: string | null;
    })[]>;
    getActiveVisitors(user: any): Promise<({
        plant: {
            id: string;
            name: string;
            code: string;
        };
        visitor: {
            id: string;
            firstName: string;
            lastName: string;
            mobile: string;
            visitorCompany: string;
            idProofType: import("@prisma/client").$Enums.IdProofType;
        };
        hostEmployee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedOutBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        vehicleNumber: string | null;
        remarks: string | null;
        purpose: string;
        logNumber: string;
        visitorId: string;
        hostEmployeeId: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        expectedOutTime: Date | null;
        checkInTime: Date;
        checkedInById: string;
        checkedOutById: string | null;
        vehicleLogId: string | null;
        checkOutTime: Date | null;
        passNumber: string | null;
    })[]>;
    checkOut(id: string, dto: CheckOutVisitorDto, user: any): Promise<{
        plant: {
            id: string;
            name: string;
            code: string;
        };
        visitor: {
            id: string;
            firstName: string;
            lastName: string;
            mobile: string;
            visitorCompany: string;
            idProofType: import("@prisma/client").$Enums.IdProofType;
        };
        hostEmployee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedInBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        checkedOutBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        vehicleNumber: string | null;
        remarks: string | null;
        purpose: string;
        logNumber: string;
        visitorId: string;
        hostEmployeeId: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        expectedOutTime: Date | null;
        checkInTime: Date;
        checkedInById: string;
        checkedOutById: string | null;
        vehicleLogId: string | null;
        checkOutTime: Date | null;
        passNumber: string | null;
    }>;
}
