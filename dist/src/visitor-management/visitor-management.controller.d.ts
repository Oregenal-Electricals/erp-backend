import { VisitorManagementService } from './visitor-management.service';
import { CreateVisitorDto, UpdateVisitorDto } from './dto/visitor.dto';
export declare class VisitorManagementController {
    private readonly service;
    constructor(service: VisitorManagementService);
    createVisitor(dto: CreateVisitorDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        email: string | null;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import(".prisma/client").$Enums.IdProofType;
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        email: string | null;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import(".prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    })[]>;
    getStats(user: any): Promise<{
        totalVisitors: number;
        activeNow: number;
        todayIn: number;
        todayOut: number;
        totalLogs: number;
        blacklisted: number;
    }>;
    findOneVisitor(id: string): Promise<{
        logs: ({
            plant: {
                id: string;
                name: string;
                code: string;
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
        })[];
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        email: string | null;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import(".prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    updateVisitor(id: string, dto: UpdateVisitorDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        email: string | null;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import(".prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    blacklistVisitor(id: string, reason: string, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
        email: string | null;
        firstName: string;
        lastName: string;
        mobile: string;
        visitorCompany: string | null;
        designation: string | null;
        idProofType: import(".prisma/client").$Enums.IdProofType;
        idProofNumber: string;
        photoUrl: string | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
}
