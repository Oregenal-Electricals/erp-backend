import { PrismaService } from '../prisma/prisma.service';
export declare class ExcelExportService {
    private prisma;
    constructor(prisma: PrismaService);
    private createWorkbook;
    private styleHeader;
    private styleDataRows;
    private addSummaryRow;
    private fmtDate;
    private fmt;
    exportArInvoices(companyId: string, query: any): Promise<any>;
    exportApBills(companyId: string, query: any): Promise<any>;
    exportPurchaseOrders(companyId: string, query: any): Promise<any>;
    exportSalesOrders(companyId: string, query: any): Promise<any>;
    exportStock(companyId: string): Promise<any>;
    exportNcr(companyId: string, query: any): Promise<any>;
    exportTasks(companyId: string, query: any): Promise<any>;
    exportTrialBalance(companyId: string, query: any): Promise<any>;
}
