import { QualityDashboardService } from './quality-dashboard.service';
export declare class QualityDashboardController {
    private readonly qdService;
    constructor(qdService: QualityDashboardService);
    getOverview(req: any): Promise<{
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
    getNcrSummary(req: any): Promise<{
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
            severity: string;
            ncrNumber: string;
            source: string;
        }[];
    }>;
    getOqcTrend(req: any): Promise<{
        trend: any[];
    }>;
    getAlerts(req: any): Promise<{
        alerts: any[];
        total: number;
    }>;
}
