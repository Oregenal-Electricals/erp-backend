import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateRfqDto, UpdateRfqDto, AddRfqVendorDto } from './dto/rfq.dto';
export declare class RfqService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateRfqNumber;
    private includes;
    create(dto: CreateRfqDto, user: any): Promise<{
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
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    update(id: string, dto: UpdateRfqDto, user: any): Promise<{
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
    send(id: string, user: any): Promise<{
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
    close(id: string, user: any): Promise<{
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
    cancel(id: string, user: any): Promise<{
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
    addVendor(id: string, dto: AddRfqVendorDto, user: any): Promise<{
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
    removeVendor(id: string, vendorId: string, user: any): Promise<{
        message: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        sent: number;
        closed: number;
        cancelled: number;
    }>;
}
