import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export interface ParsedTemplate {
    sheetName: string;
    name: string;
    docCode: string | null;
    parameters: {
        sNo: number;
        category: string;
        parameterName: string;
        specification: string;
    }[];
    error: string | null;
}
export declare class IqcTemplateImportService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    parseWorkbook(file: Express.Multer.File): ParsedTemplate[];
    private parseSheet;
    confirmImport(parsed: {
        sheetName: string;
        name: string;
        docCode?: string | null;
        parameters: {
            sNo: number;
            category: string;
            parameterName: string;
            specification: string;
        }[];
        error?: string | null;
    }[], user: any): Promise<{
        createdCount: number;
        created: string[];
        skippedCount: number;
        skipped: {
            sheetName: string;
            reason: string;
        }[];
    }>;
}
