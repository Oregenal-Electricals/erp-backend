import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { BomService } from '../bom/bom.service';
import { ConfirmBomImportDto } from './dto/bom-import.dto';
interface ParsedItem {
    sNo: any;
    partCode: string;
    description: string;
    package: string | null;
    quantity: number | null;
    uom: string;
    location: string | null;
    preferredMake: string | null;
    alternateMakes: string | null;
}
interface ParsedSection {
    name: string;
    items: ParsedItem[];
}
export declare class BomImportService {
    private prisma;
    private audit;
    private bomService;
    constructor(prisma: PrismaService, audit: AuditService, bomService: BomService);
    private parseRows;
    private rowsFromExcelBuffer;
    private rowsFromCsvBuffer;
    parseFile(file: Express.Multer.File, companyId: string): Promise<{
        product: any;
        docInfo: any;
        sections: ParsedSection[];
        productExists: boolean;
        existingProduct: any;
        totalItems: number;
        newRawMaterialsCount: number;
        existingRawMaterialsCount: number;
    }>;
    private buildPreview;
    confirmImport(dto: ConfirmBomImportDto, user: any): Promise<{
        bomId: string;
        bomNumber: string;
        productId: string;
        itemsImported: number;
    }>;
    private sanitizeBrandPrefix;
    private generateBomNumberInTx;
}
export {};
