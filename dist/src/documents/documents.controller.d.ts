import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, NewVersionDto } from './dto/document.dto';
export declare class DocumentsController {
    private readonly docsService;
    constructor(docsService: DocumentsService);
    getStats(req: any): Promise<{
        total: number;
        byCategory: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.DocumentGroupByOutputType, "category"[]> & {
            _count: {
                id: number;
            };
        })[];
        totalSizeBytes: number;
        totalSizeMB: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: {
            id: string;
            description: string;
            createdAt: Date;
            createdBy: string;
            _count: {
                versions: number;
            };
            category: string;
            tags: string;
            title: string;
            version: number;
            documentNumber: string;
            referenceType: string;
            referenceNumber: string;
            fileType: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<any>;
    download(id: string, req: any, res: Response): Promise<void>;
    create(dto: CreateDocumentDto, req: any): Promise<any>;
    createVersion(dto: NewVersionDto, req: any): Promise<any>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
}
