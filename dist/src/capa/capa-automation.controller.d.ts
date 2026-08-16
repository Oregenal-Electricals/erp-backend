import { CapaAutomationService } from './capa-automation.service';
export declare class CapaAutomationController {
    private readonly capaAutoService;
    constructor(capaAutoService: CapaAutomationService);
    autoCreate(ncrId: string, req: any): Promise<{
        created: boolean;
        reason: string;
        capaId?: undefined;
        capaNumber?: undefined;
        dueDate?: undefined;
        message?: undefined;
    } | {
        created: boolean;
        reason: string;
        capaId: string;
        capaNumber: string;
        dueDate?: undefined;
        message?: undefined;
    } | {
        created: boolean;
        capaId: string;
        capaNumber: string;
        dueDate: Date;
        message: string;
        reason?: undefined;
    }>;
    checkEscalations(req: any): Promise<{
        overdue: {
            id: string;
            capaNumber: string;
            dueDate: Date;
            assignedTo: string;
            ncrNumber: string;
            daysOverdue: number;
        }[];
        approaching: {
            id: string;
            capaNumber: string;
            dueDate: Date;
            assignedTo: string;
            ncrNumber: string;
            daysRemaining: number;
        }[];
        unactioned: {
            id: string;
            capaNumber: string;
            assignedTo: string;
            ncrNumber: string;
            hoursUnactioned: number;
        }[];
        summary: {
            overdueCount: number;
            approachingCount: number;
            unactionedCount: number;
        };
    }>;
    checkEffectiveness(capaId: string, req: any): Promise<{
        error: string;
        effective?: undefined;
        reason?: undefined;
        capaId?: undefined;
        capaNumber?: undefined;
        ncrSource?: undefined;
        ncrItem?: undefined;
        verifiedDate?: undefined;
        recurringNcrs?: undefined;
        recurringDetails?: undefined;
        message?: undefined;
    } | {
        effective: any;
        reason: string;
        error?: undefined;
        capaId?: undefined;
        capaNumber?: undefined;
        ncrSource?: undefined;
        ncrItem?: undefined;
        verifiedDate?: undefined;
        recurringNcrs?: undefined;
        recurringDetails?: undefined;
        message?: undefined;
    } | {
        capaId: string;
        capaNumber: string;
        ncrSource: string;
        ncrItem: string;
        verifiedDate: Date;
        effective: boolean;
        recurringNcrs: number;
        recurringDetails: {
            severity: string;
            ncrNumber: string;
            source: string;
            detectedDate: Date;
        }[];
        message: string;
        error?: undefined;
        reason?: undefined;
    }>;
    getHealthScore(req: any): Promise<{
        total: number;
        completed: number;
        verified: number;
        overdue: number;
        critical: number;
        completionRate: number;
        overdueRate: number;
        healthScore: number;
        grade: string;
    }>;
}
