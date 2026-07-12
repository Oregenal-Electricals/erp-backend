import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreateVisitorDto, UpdateVisitorDto, CheckInVisitorDto, CheckOutVisitorDto } from './dto/visitor.dto';
import { VisitorStatus } from '@prisma/client';
export declare class VisitorManagementService {
    private prisma;
    private audit;
    private settings;
    constructor(prisma: PrismaService, audit: AuditService, settings: SettingsService);
    createVisitor(dto: CreateVisitorDto, user: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import("@prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    findAllVisitors(user: any, search?: string): Promise<({
        _count: {
            logs: number;
        };
    } & {
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import("@prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    })[]>;
    findOneVisitor(id: string): Promise<{
        logs: ({
            plant: {
                id: string;
                code: string;
                name: string;
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
            status: import("@prisma/client").$Enums.VisitorStatus;
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
    } & {
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import("@prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    updateVisitor(id: string, dto: UpdateVisitorDto, user: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import("@prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    blacklistVisitor(id: string, reason: string, user: any): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import("@prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    checkIn(dto: CheckInVisitorDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
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
    checkOut(id: string, dto: CheckOutVisitorDto, user: any): Promise<{
        plant: {
            id: string;
            code: string;
            name: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
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
    findAllLogs(user: any, filters: {
        plantId?: string;
        status?: VisitorStatus;
        date?: string;
    }): Promise<({
        plant: {
            id: string;
            code: string;
            name: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
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
            code: string;
            name: string;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        plantId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
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
    getStats(user: any): Promise<{
        totalVisitors: number;
        activeNow: number;
        todayIn: number;
        todayOut: number;
        totalLogs: number;
        blacklisted: number;
    }>;
    private logIncludes;
}
