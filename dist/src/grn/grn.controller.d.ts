import { GrnService } from './grn.service';
import { CreateGrnDto, UpdateGrnDto } from './dto/grn.dto';
export declare class GrnController {
    private readonly grnService;
    constructor(grnService: GrnService);
    getStats(req: any): Promise<{
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
    findAll(req: any, query: any): Promise<{
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
    create(dto: CreateGrnDto, req: any): Promise<{
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
    update(id: string, dto: UpdateGrnDto, req: any): Promise<{
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
    submit(id: string, req: any): Promise<{
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
}
