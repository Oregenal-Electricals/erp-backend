import { RfqService } from './rfq.service';
import { CreateRfqDto, UpdateRfqDto, AddRfqVendorDto } from './dto/rfq.dto';
export declare class RfqController {
    private readonly rfqService;
    constructor(rfqService: RfqService);
    getStats(req: any): Promise<{
        total: number;
        draft: number;
        sent: number;
        closed: number;
        cancelled: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
                vendors: number;
            };
            pr: {
                title: string;
                prNumber: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            description: string | null;
            status: string;
            paymentTerms: string | null;
            notes: string | null;
            prId: string;
            rfqNumber: string;
            title: string;
            responseDeadline: Date;
            deliveryLocation: string | null;
            closedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    create(dto: CreateRfqDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    update(id: string, dto: UpdateRfqDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    send(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    close(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    cancel(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            notes: string | null;
            uom: string;
            rfqId: string;
            prItemId: string | null;
            requiredQty: number;
        }[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
        vendors: ({
            vendor: {
                name: string;
                code: string;
                email: string;
                phone: string;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            rfqId: string;
            vendorId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        description: string | null;
        status: string;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        rfqNumber: string;
        title: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        closedAt: Date | null;
    }>;
    addVendor(id: string, dto: AddRfqVendorDto, req: any): Promise<{
        vendor: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        rfqId: string;
        vendorId: string;
    }>;
    removeVendor(id: string, vendorId: string, req: any): Promise<{
        message: string;
    }>;
}
