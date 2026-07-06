import { PrismaService } from '../prisma/prisma.service';
export declare class SalarySlipService {
    private prisma;
    constructor(prisma: PrismaService);
    generateSlip(employeeId: string, month: number, year: number, companyId: string): Promise<Buffer>;
    generateBulkSlips(payrollRunId: string, companyId: string): Promise<Buffer>;
    private buildPdf;
    private renderSlipPage;
    getSlipHistory(companyId: string, employeeId: string): Promise<{
        id: string;
        status: string;
        year: number;
        month: number;
        grossEarnings: number;
        netPay: number;
        payrollRunId: string;
    }[]>;
}
