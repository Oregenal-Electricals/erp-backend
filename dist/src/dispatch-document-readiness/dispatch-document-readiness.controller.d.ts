import { DispatchDocumentReadinessService } from './dispatch-document-readiness.service';
export declare class DispatchDocumentReadinessController {
    private readonly readinessService;
    constructor(readinessService: DispatchDocumentReadinessService);
    checkReadiness(id: string, req: any): Promise<{
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
