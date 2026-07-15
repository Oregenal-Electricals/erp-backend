import { BomImportService } from './bom-import.service';
import { ConfirmBomImportDto } from './dto/bom-import.dto';
export declare class BomImportController {
    private readonly service;
    constructor(service: BomImportService);
    parse(file: Express.Multer.File, user: any): Promise<any>;
    confirm(dto: ConfirmBomImportDto, user: any): Promise<{
        bomId: string;
        bomNumber: string;
        productId: string;
        itemsImported: number;
    }>;
}
