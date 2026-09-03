import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { PauseDto, ResumeDto } from './dto/downtime.dto';
export declare class DowntimeService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    pause(dto: PauseDto, user: any): Promise<{
        workOrder: {
            id: string;
            status: string;
            stageName: string;
            woNumber: string;
        };
        startedBy: {
            firstName: string;
            lastName: string;
        };
        resumedBy: {
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
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string;
        reason: string;
        remarks: string | null;
        workOrderId: string;
        startTime: Date;
        endTime: Date | null;
        startedByUserId: string;
        resumedByUserId: string | null;
    }>;
    resume(id: string, dto: ResumeDto, user: any): Promise<{
        workOrder: {
            id: string;
            status: string;
            stageName: string;
            woNumber: string;
        };
        startedBy: {
            firstName: string;
            lastName: string;
        };
        resumedBy: {
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
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string;
        reason: string;
        remarks: string | null;
        workOrderId: string;
        startTime: Date;
        endTime: Date | null;
        startedByUserId: string;
        resumedByUserId: string | null;
    }>;
    findAll(user: any, query: any): Promise<({
        workOrder: {
            id: string;
            status: string;
            stageName: string;
            woNumber: string;
        };
        startedBy: {
            firstName: string;
            lastName: string;
        };
        resumedBy: {
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
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string;
        reason: string;
        remarks: string | null;
        workOrderId: string;
        startTime: Date;
        endTime: Date | null;
        startedByUserId: string;
        resumedByUserId: string | null;
    })[]>;
    getCumulativeDowntime(workOrderId: string, user: any): Promise<{
        workOrderId: string;
        downtimeCount: number;
        totalMinutes: number;
    }>;
}
