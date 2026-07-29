import { PrismaService } from '../prisma/prisma.service';
export declare class PdfEngineService {
    private prisma;
    constructor(prisma: PrismaService);
    private createDoc;
    private addHeader;
    private addFooter;
    private addTwoCol;
    private addTableHeader;
    private addTableRow;
    private addSummaryBox;
    generatePurchaseOrderPdf(id: string, companyId: string): Promise<Buffer>;
    generateArInvoicePdf(id: string, companyId: string): Promise<Buffer>;
    generateDispatchPdf(id: string, companyId: string): Promise<Buffer>;
    generateNcrPdf(id: string, companyId: string): Promise<Buffer>;
}
