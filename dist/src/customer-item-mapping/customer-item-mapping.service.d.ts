import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ResolveOrCreateMappingDto, RequestMappingChangeDto } from './dto/customer-item-mapping.dto';
export declare class CustomerItemMappingService {
    private prisma;
    private audit;
    private workflows;
    constructor(prisma: PrismaService, audit: AuditService, workflows: WorkflowsService);
    private includes;
    private validateExactlyOneTarget;
    resolve(customerId: string, customerItemCode: string, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
        };
        rawMaterial: {
            id: string;
            name: string;
            code: string;
        };
        customer: {
            id: string;
            name: string;
            code: string;
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
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
    createIfMissing(dto: ResolveOrCreateMappingDto, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
        };
        rawMaterial: {
            id: string;
            name: string;
            code: string;
        };
        customer: {
            id: string;
            name: string;
            code: string;
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
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
    requestChange(id: string, dto: RequestMappingChangeDto, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
        };
        rawMaterial: {
            id: string;
            name: string;
            code: string;
        };
        customer: {
            id: string;
            name: string;
            code: string;
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
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
    onWorkflowApproved(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
    onWorkflowRejected(id: string, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
    findAll(user: any, query: any): Promise<({
        product: {
            id: string;
            name: string;
            code: string;
        };
        rawMaterial: {
            id: string;
            name: string;
            code: string;
        };
        customer: {
            id: string;
            name: string;
            code: string;
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
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        product: {
            id: string;
            name: string;
            code: string;
        };
        rawMaterial: {
            id: string;
            name: string;
            code: string;
        };
        customer: {
            id: string;
            name: string;
            code: string;
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
        productId: string | null;
        rawMaterialId: string | null;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
        pendingRawMaterialId: string | null;
    }>;
}
