import { CustomerItemMappingService } from './customer-item-mapping.service';
import { ResolveOrCreateMappingDto, RequestMappingChangeDto } from './dto/customer-item-mapping.dto';
export declare class CustomerItemMappingController {
    private readonly service;
    constructor(service: CustomerItemMappingService);
    findAll(req: any, query: any): Promise<({
        product: {
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
        productId: string;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
    })[]>;
    resolve(req: any, customerId: string, customerItemCode: string): Promise<{
        product: {
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
        productId: string;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
    }>;
    findOne(id: string, req: any): Promise<{
        product: {
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
        productId: string;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
    }>;
    createIfMissing(dto: ResolveOrCreateMappingDto, req: any): Promise<{
        product: {
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
        productId: string;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
    }>;
    requestChange(id: string, dto: RequestMappingChangeDto, req: any): Promise<{
        product: {
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
        productId: string;
        customerId: string;
        customerItemCode: string;
        customerItemName: string | null;
        pendingProductId: string | null;
    }>;
}
