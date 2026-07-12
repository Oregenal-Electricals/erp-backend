import { Response } from 'express';
import { SalarySlipService } from './salary-slip.service';
export declare class SalarySlipController {
    private readonly slipService;
    constructor(slipService: SalarySlipService);
    getHistory(empId: string, req: any): Promise<{
        id: string;
        status: string;
        year: number;
        month: number;
        grossEarnings: number;
        netPay: number;
        payrollRunId: string;
    }[]>;
    downloadSlip(empId: string, month: string, year: string, req: any, res: Response): Promise<void>;
    downloadBulk(runId: string, req: any, res: Response): Promise<void>;
}
