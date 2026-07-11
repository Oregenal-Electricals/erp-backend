import { BomRevisionService } from './bom-revision.service';
import { CreateBomRevisionDto } from './dto/bom-revision.dto';
export declare class BomRevisionController {
    private readonly bomRevisionService;
    constructor(bomRevisionService: BomRevisionService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        approved: number;
        major: number;
        minor: number;
        patch: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            bom: {
                status: string;
                version: string;
                bomNumber: string;
            };
            product: {
                code: string;
                name: string;
            };
            previousBom: {
                version: string;
                bomNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            bomId: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            productId: string;
            previousBomId: string | null;
            revisionNumber: string;
            changeType: string;
            changeDescription: string;
            ecnNumber: string | null;
            effectiveDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByProduct(productId: string, req: any): Promise<({
        bom: {
            status: string;
            version: string;
            bomNumber: string;
        };
        product: {
            code: string;
            name: string;
        };
        previousBom: {
            version: string;
            bomNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        bomId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        previousBomId: string | null;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        ecnNumber: string | null;
        effectiveDate: Date;
    })[]>;
    findOne(id: string, req: any): Promise<{
        bom: {
            items: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                itemCode: string;
                itemName: string;
                unitCost: number | null;
                notes: string | null;
                uom: string;
                bomId: string;
                sequence: number;
                rawMaterialId: string | null;
                totalCost: number | null;
                itemType: string;
                quantity: number;
                wastagePercent: number | null;
                effectiveQty: number;
                isCritical: boolean;
            }[];
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            version: string;
            totalCost: number | null;
            productId: string;
            revisionId: string | null;
            bomNumber: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
        };
        product: {
            code: string;
            name: string;
        };
        previousBom: {
            items: {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                itemCode: string;
                itemName: string;
                unitCost: number | null;
                notes: string | null;
                uom: string;
                bomId: string;
                sequence: number;
                rawMaterialId: string | null;
                totalCost: number | null;
                itemType: string;
                quantity: number;
                wastagePercent: number | null;
                effectiveQty: number;
                isCritical: boolean;
            }[];
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            version: string;
            totalCost: number | null;
            productId: string;
            revisionId: string | null;
            bomNumber: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        bomId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        previousBomId: string | null;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        ecnNumber: string | null;
        effectiveDate: Date;
    }>;
    create(dto: CreateBomRevisionDto, req: any): Promise<{
        bom: {
            status: string;
            version: string;
            bomNumber: string;
        };
        product: {
            code: string;
            name: string;
        };
        previousBom: {
            version: string;
            bomNumber: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        bomId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        previousBomId: string | null;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        ecnNumber: string | null;
        effectiveDate: Date;
    }>;
    approve(id: string, req: any): Promise<{
        bom: {
            status: string;
            version: string;
            bomNumber: string;
        };
        product: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        bomId: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        previousBomId: string | null;
        revisionNumber: string;
        changeType: string;
        changeDescription: string;
        ecnNumber: string | null;
        effectiveDate: Date;
    }>;
}
