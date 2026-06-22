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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            description: string | null;
            status: string;
            title: string;
            closedAt: Date | null;
            paymentTerms: string | null;
            notes: string | null;
            prId: string;
            responseDeadline: Date;
            deliveryLocation: string | null;
            rfqNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    create(dto: CreateRfqDto, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    update(id: string, dto: UpdateRfqDto, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    send(id: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    close(id: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    cancel(id: string, req: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            itemCode: string;
            itemName: string;
            uom: string;
            notes: string | null;
            requiredQty: number;
            prItemId: string | null;
            rfqId: string;
        }[];
        vendors: ({
            vendor: {
                code: string;
                name: string;
                phone: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vendorId: string;
            rfqId: string;
        })[];
        pr: {
            status: string;
            title: string;
            prNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        description: string | null;
        status: string;
        title: string;
        closedAt: Date | null;
        paymentTerms: string | null;
        notes: string | null;
        prId: string;
        responseDeadline: Date;
        deliveryLocation: string | null;
        rfqNumber: string;
    }>;
    addVendor(id: string, dto: AddRfqVendorDto, req: any): Promise<{
        vendor: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        vendorId: string;
        rfqId: string;
    }>;
    removeVendor(id: string, vendorId: string, req: any): Promise<{
        message: string;
    }>;
}
