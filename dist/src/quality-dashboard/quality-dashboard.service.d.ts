import { PrismaService } from '../prisma/prisma.service';
export declare class QualityDashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverview(user: any): Promise<{
        ncr: {
            total: number;
            open: number;
            critical: number;
            closed: number;
        };
        capa: {
            total: number;
            overdue: number;
            inProgress: number;
            verified: number;
        };
        rca: {
            draft: number;
        };
        oqc: {
            total: number;
            pass: number;
            fail: number;
            released: number;
            passRate: number;
        };
        complaints: {
            total: number;
            open: number;
            critical: number;
        };
        supplier: {
            blacklisted: number;
            probation: number;
            openCars: number;
        };
    }>;
    getNcrSummary(user: any): Promise<{
        bySource: {
            source: string;
            count: number;
        }[];
        bySeverity: {
            severity: string;
            count: number;
        }[];
        byStatus: {
            status: string;
            count: number;
        }[];
        recent: {
            description: string;
            createdAt: Date;
            status: string;
            ncrNumber: string;
            source: string;
            severity: string;
        }[];
    }>;
    getOqcTrend(user: any): Promise<{
        trend: any[];
    }>;
    getAlerts(user: any): Promise<{
        alerts: any[];
        total: number;
    }>;
}
