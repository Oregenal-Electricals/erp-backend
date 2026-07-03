import { Response } from 'express';
import { PdfEngineService } from './pdf-engine.service';
export declare class PdfEngineController {
    private readonly pdfService;
    constructor(pdfService: PdfEngineService);
    poPdf(id: string, req: any, res: Response): Promise<void>;
    invoicePdf(id: string, req: any, res: Response): Promise<void>;
    dispatchPdf(id: string, req: any, res: Response): Promise<void>;
    ncrPdf(id: string, req: any, res: Response): Promise<void>;
}
