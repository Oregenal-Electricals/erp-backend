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
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
                code: string;
                name: string;
                email: string;
                phone: string;
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
            rfqId: string;
            vendorId: string;
        })[];
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
        rfqId: string;
        vendorId: string;
    }>;
    removeVendor(id: string, vendorId: string, req: any): Promise<{
        message: string;
    }>;
}
