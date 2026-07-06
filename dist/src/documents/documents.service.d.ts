import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDocumentDto, NewVersionDto } from './dto/document.dto';
export declare class DocumentsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private detectFileType;
    create(dto: CreateDocumentDto, user: any): Promise<any>;
    createVersion(dto: NewVersionDto, user: any): Promise<any>;
    findAll(user: any, query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            createdBy: string;
            description: string;
            _count: {
                versions: number;
            };
            tags: string;
            referenceNumber: string;
            referenceType: string;
            title: string;
            documentNumber: string;
            category: string;
            fileType: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            version: number;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<any>;
    download(id: string, user: any): Promise<{
        fileData: string;
        fileName: string;
        mimeType: string;
    }>;
    delete(id: string, user: any): Promise<{
        message: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        byCategory: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.DocumentGroupByOutputType, "category"[]> & {
            _count: {
                id: number;
            };
        })[];
        totalSizeBytes: number;
        totalSizeMB: number;
    }>;
    private sanitize;
}
