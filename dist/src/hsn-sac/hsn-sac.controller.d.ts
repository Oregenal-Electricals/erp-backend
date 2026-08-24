import { HsnSacService } from './hsn-sac.service';
import { CreateHsnSacDto, UpdateHsnSacDto } from './dto/hsn-sac.dto';
export declare class HsnSacController {
    private readonly hsnSacService;
    constructor(hsnSacService: HsnSacService);
    getStats(req: any): Promise<{
        total: number;
        active: number;
        inactive: number;
        hsn: number;
        sac: number;
        zeroRated: number;
        standard: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
            cessRate: number | null;
            igstRate: number;
            cgstRate: number;
            sgstRate: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
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
        cessRate: number | null;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
    }>;
    create(dto: CreateHsnSacDto, req: any): Promise<{
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
        cessRate: number | null;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
    }>;
    update(id: string, dto: UpdateHsnSacDto, req: any): Promise<{
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
        cessRate: number | null;
        igstRate: number;
        cgstRate: number;
        sgstRate: number;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
