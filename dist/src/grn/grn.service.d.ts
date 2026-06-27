import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';
export declare class GrnService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateGrnNumber;
    private includes;
    create(dto: CreateGrnDto, user: any): Promise<{
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
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            ipoItemId: string | null;
            landedCostPerUnit: number | null;
            poItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            totalValue: number;
            grnId: string;
        }[];
        warehouse: {
            code: string;
            name: string;
        };
        po: {
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        warehouseId: string;
        poId: string | null;
        ipoId: string | null;
        landedCostId: string | null;
        grnType: string;
        receivedDate: Date;
        dcNumber: string | null;
        grnNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                code: string;
                name: string;
            };
            _count: {
                items: number;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vehicleNumber: string | null;
            remarks: string | null;
            invoiceNumber: string | null;
            invoiceDate: Date | null;
            warehouseId: string;
            poId: string | null;
            ipoId: string | null;
            landedCostId: string | null;
            grnType: string;
            receivedDate: Date;
            dcNumber: string | null;
            grnNumber: string;
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
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            ipoItemId: string | null;
            landedCostPerUnit: number | null;
            poItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            totalValue: number;
            grnId: string;
        }[];
        warehouse: {
            code: string;
            name: string;
        };
        po: {
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        warehouseId: string;
        poId: string | null;
        ipoId: string | null;
        landedCostId: string | null;
        grnType: string;
        receivedDate: Date;
        dcNumber: string | null;
        grnNumber: string;
    }>;
    update(id: string, dto: UpdateGrnDto, user: any): Promise<{
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
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            ipoItemId: string | null;
            landedCostPerUnit: number | null;
            poItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            totalValue: number;
            grnId: string;
        }[];
        warehouse: {
            code: string;
            name: string;
        };
        po: {
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        warehouseId: string;
        poId: string | null;
        ipoId: string | null;
        landedCostId: string | null;
        grnType: string;
        receivedDate: Date;
        dcNumber: string | null;
        grnNumber: string;
    }>;
    submit(id: string, user: any): Promise<{
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
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            ipoItemId: string | null;
            landedCostPerUnit: number | null;
            poItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            rejectedQty: number;
            totalValue: number;
            grnId: string;
        }[];
        warehouse: {
            code: string;
            name: string;
        };
        po: {
            vendor: {
                code: string;
                name: string;
            };
            poNumber: string;
        };
        ipo: {
            vendor: {
                code: string;
                name: string;
            };
            ipoNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        warehouseId: string;
        poId: string | null;
        ipoId: string | null;
        landedCostId: string | null;
        grnType: string;
        receivedDate: Date;
        dcNumber: string | null;
        grnNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        iqcPending: number;
        accepted: number;
        closed: number;
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.GrnHeaderGroupByOutputType, "grnType"[]> & {
            _count: number;
        })[];
        totalValue: number;
    }>;
}
