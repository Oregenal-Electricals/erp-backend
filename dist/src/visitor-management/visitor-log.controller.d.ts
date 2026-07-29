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
            idProofType: import(".prisma/client").$Enums.IdProofType;
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
            idProofType: import(".prisma/client").$Enums.IdProofType;
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
            idProofType: import(".prisma/client").$Enums.IdProofType;
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
            idProofType: import(".prisma/client").$Enums.IdProofType;
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
    }>;
}
