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
            product: {
                name: string;
                code: string;
            };
            bom: {
                status: string;
                version: string;
                bomNumber: string;
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
            approvedBy: string | null;
            approvedAt: Date | null;
            productId: string;
            revisionNumber: string;
            changeDescription: string;
            changeType: string;
            effectiveDate: Date;
            bomId: string;
            previousBomId: string | null;
            ecnNumber: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByProduct(productId: string, req: any): Promise<({
        product: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        effectiveDate: Date;
        bomId: string;
        previousBomId: string | null;
        ecnNumber: string | null;
    })[]>;
    findOne(id: string, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
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
                quantity: number;
                notes: string | null;
                itemCode: string;
                itemName: string;
                itemType: string;
                uom: string;
                sequence: number;
                rawMaterialId: string | null;
                wastagePercent: number | null;
                unitCost: number | null;
                isCritical: boolean;
                totalCost: number | null;
                bomId: string;
                effectiveQty: number;
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
            productId: string;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
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
                quantity: number;
                notes: string | null;
                itemCode: string;
                itemName: string;
                itemType: string;
                uom: string;
                sequence: number;
                rawMaterialId: string | null;
                wastagePercent: number | null;
                unitCost: number | null;
                isCritical: boolean;
                totalCost: number | null;
                bomId: string;
                effectiveQty: number;
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
            productId: string;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        effectiveDate: Date;
        bomId: string;
        previousBomId: string | null;
        ecnNumber: string | null;
    }>;
    create(dto: CreateBomRevisionDto, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        effectiveDate: Date;
        bomId: string;
        previousBomId: string | null;
        ecnNumber: string | null;
    }>;
    approve(id: string, req: any): Promise<{
        product: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
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
        approvedBy: string | null;
        approvedAt: Date | null;
        productId: string;
        revisionNumber: string;
        changeDescription: string;
        changeType: string;
        effectiveDate: Date;
        bomId: string;
        previousBomId: string | null;
        ecnNumber: string | null;
    }>;
}
