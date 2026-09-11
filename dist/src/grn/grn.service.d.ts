import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StoreShortageService } from '../store-receiving/store-shortage.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';
export declare class GrnService {
    private prisma;
    private audit;
    private shortageService;
    constructor(prisma: PrismaService, audit: AuditService, shortageService: StoreShortageService);
    private generateGrnNumber;
    private includes;
    create(dto: CreateGrnDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            orderedQty: number;
            receivedQty: number;
            unitPrice: number;
            grnId: string;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            heldQty: number;
            landedCostPerUnit: number | null;
            totalValue: number;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        po: {
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        gateInwardEntryId: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
        warehouseId: string;
        receivedDate: Date;
        dcNumber: string | null;
        physicallyVerifiedAt: Date | null;
        reversedById: string | null;
        reversedAt: Date | null;
        reversalReason: string | null;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            warehouse: {
                name: string;
                code: string;
            };
            po: {
                vendor: {
                    name: string;
                };
                poNumber: string;
            };
            ipo: {
                vendor: {
                    name: string;
                };
                ipoNumber: string;
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
            vehicleNumber: string | null;
            remarks: string | null;
            poId: string | null;
            invoiceNumber: string | null;
            invoiceDate: Date | null;
            gateInwardEntryId: string | null;
            grnNumber: string;
            grnType: string;
            ipoId: string | null;
            landedCostId: string | null;
            warehouseId: string;
            receivedDate: Date;
            dcNumber: string | null;
            physicallyVerifiedAt: Date | null;
            reversedById: string | null;
            reversedAt: Date | null;
            reversalReason: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            orderedQty: number;
            receivedQty: number;
            unitPrice: number;
            grnId: string;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            heldQty: number;
            landedCostPerUnit: number | null;
            totalValue: number;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        po: {
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        gateInwardEntryId: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
        warehouseId: string;
        receivedDate: Date;
        dcNumber: string | null;
        physicallyVerifiedAt: Date | null;
        reversedById: string | null;
        reversedAt: Date | null;
        reversalReason: string | null;
    }>;
    update(id: string, dto: UpdateGrnDto, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            orderedQty: number;
            receivedQty: number;
            unitPrice: number;
            grnId: string;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            heldQty: number;
            landedCostPerUnit: number | null;
            totalValue: number;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        po: {
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        gateInwardEntryId: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
        warehouseId: string;
        receivedDate: Date;
        dcNumber: string | null;
        physicallyVerifiedAt: Date | null;
        reversedById: string | null;
        reversedAt: Date | null;
        reversalReason: string | null;
    }>;
    submit(id: string, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            orderedQty: number;
            receivedQty: number;
            unitPrice: number;
            grnId: string;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            heldQty: number;
            landedCostPerUnit: number | null;
            totalValue: number;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        po: {
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        gateInwardEntryId: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
        warehouseId: string;
        receivedDate: Date;
        dcNumber: string | null;
        physicallyVerifiedAt: Date | null;
        reversedById: string | null;
        reversedAt: Date | null;
        reversalReason: string | null;
    }>;
    reverse(id: string, dto: {
        reason: string;
    }, user: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            poItemId: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            orderedQty: number;
            receivedQty: number;
            unitPrice: number;
            grnId: string;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            heldQty: number;
            landedCostPerUnit: number | null;
            totalValue: number;
        }[];
        warehouse: {
            name: string;
            code: string;
        };
        po: {
            vendor: {
                name: string;
                code: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                name: string;
                code: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        poId: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        gateInwardEntryId: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
        warehouseId: string;
        receivedDate: Date;
        dcNumber: string | null;
        physicallyVerifiedAt: Date | null;
        reversedById: string | null;
        reversedAt: Date | null;
        reversalReason: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        iqcPending: number;
        accepted: number;
        closed: number;
        byType: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.GrnHeaderGroupByOutputType, "grnType"[]> & {
            _count: number;
        })[];
        totalValue: number;
    }>;
}
