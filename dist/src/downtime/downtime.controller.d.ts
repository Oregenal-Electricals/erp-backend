import { DowntimeService } from './downtime.service';
import { PauseDto, ResumeDto } from './dto/downtime.dto';
export declare class DowntimeController {
    private downtimeService;
    constructor(downtimeService: DowntimeService);
    findAll(req: any, query: any): Promise<({
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
    getCumulative(workOrderId: string, req: any): Promise<{
        workOrderId: string;
        downtimeCount: number;
        totalMinutes: number;
    }>;
    pause(dto: PauseDto, req: any): Promise<{
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
    resume(id: string, dto: ResumeDto, req: any): Promise<{
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
}
