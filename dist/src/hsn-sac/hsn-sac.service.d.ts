import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateHsnSacDto, UpdateHsnSacDto } from './dto/hsn-sac.dto';
export declare class HsnSacService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(dto: CreateHsnSacDto, user: any): Promise<{
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        gstRate: number;
        codeType: string;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
        cessRate: number | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            description: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            code: string;
            gstRate: number;
            codeType: string;
            igstRate: number;
            cgstRate: number;
            sgstRate: number;
            cessRate: number | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        gstRate: number;
        codeType: string;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
        cessRate: number | null;
    }>;
    update(id: string, dto: UpdateHsnSacDto, user: any): Promise<{
        id: string;
        companyId: string;
        description: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        code: string;
        gstRate: number;
        codeType: string;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
        cessRate: number | null;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        active: number;
        inactive: number;
        hsn: number;
        sac: number;
        zeroRated: number;
        standard: number;
    }>;
}
