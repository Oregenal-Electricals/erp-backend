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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        status: import("@prisma/client").$Enums.VisitorStatus;
        remarks: string | null;
        vehicleNumber: string | null;
        plantId: string;
        logNumber: string;
        purpose: string;
        vehicleLogId: string | null;
        visitorId: string;
        hostEmployeeId: string | null;
        checkedInById: string;
        checkedOutById: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        checkInTime: Date;
        checkOutTime: Date | null;
        expectedOutTime: Date | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        status: import("@prisma/client").$Enums.VisitorStatus;
        remarks: string | null;
        vehicleNumber: string | null;
        plantId: string;
        logNumber: string;
        purpose: string;
        vehicleLogId: string | null;
        visitorId: string;
        hostEmployeeId: string | null;
        checkedInById: string;
        checkedOutById: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        checkInTime: Date;
        checkOutTime: Date | null;
        expectedOutTime: Date | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        status: import("@prisma/client").$Enums.VisitorStatus;
        remarks: string | null;
        vehicleNumber: string | null;
        plantId: string;
        logNumber: string;
        purpose: string;
        vehicleLogId: string | null;
        visitorId: string;
        hostEmployeeId: string | null;
        checkedInById: string;
        checkedOutById: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        checkInTime: Date;
        checkOutTime: Date | null;
        expectedOutTime: Date | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        status: import("@prisma/client").$Enums.VisitorStatus;
        remarks: string | null;
        vehicleNumber: string | null;
        plantId: string;
        logNumber: string;
        purpose: string;
        vehicleLogId: string | null;
        visitorId: string;
        hostEmployeeId: string | null;
        checkedInById: string;
        checkedOutById: string | null;
        itemsCarried: string | null;
        areasToVisit: string | null;
        checkInTime: Date;
        checkOutTime: Date | null;
        expectedOutTime: Date | null;
        passNumber: string | null;
    }>;
}
