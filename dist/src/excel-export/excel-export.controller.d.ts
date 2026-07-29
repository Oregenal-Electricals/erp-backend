import { Response } from 'express';
import { ExcelExportService } from './excel-export.service';
export declare class ExcelExportController {
    private readonly excelService;
    constructor(excelService: ExcelExportService);
    private send;
    arInvoices(req: any, query: any, res: Response): Promise<void>;
    apBills(req: any, query: any, res: Response): Promise<void>;
    purchaseOrders(req: any, query: any, res: Response): Promise<void>;
    salesOrders(req: any, query: any, res: Response): Promise<void>;
    stock(req: any, res: Response): Promise<void>;
    ncr(req: any, query: any, res: Response): Promise<void>;
    tasks(req: any, query: any, res: Response): Promise<void>;
    trialBalance(req: any, query: any, res: Response): Promise<void>;
}
