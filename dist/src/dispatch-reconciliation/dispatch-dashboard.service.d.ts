import { PrismaService } from '../prisma/prisma.service';
export declare class DispatchDashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboard(user: any): Promise<{
        dispatchOrdersPending: number;
        stockReservationPending: number;
        pickingPending: number;
        documentsPending: number;
        vehiclePending: number;
        loadingPending: number;
        readyForGateOut: number;
        gateOutPending: number;
        partiallyDispatched: number;
        reconciliationExceptions: number;
    }>;
}
