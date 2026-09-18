import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class DispatchDocumentReadinessService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    checkReadiness(dispatchPlanId: string, user: any): Promise<{
        dispatchPlanId: string;
        planNumber: string;
        soNumber: string;
        customerName: string;
        invoice: {
            status: string;
            reason: string;
            invoiceNumber: string;
            invoiceStatusRaw: string;
        };
        challan: {
            status: string;
            reason: string;
        };
        ewayBill: {
            status: string;
            reason: string;
            ewayBillNumber: string;
        };
        eInvoiceIrn: {
            status: string;
            reason: string;
        };
        overall: string;
        checkedBy: any;
        checkedAt: string;
    }>;
}
