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
        byType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.GrnHeaderGroupByOutputType, "grnType"[]> & {
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
                code: string;
                name: string;
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
            remarks: string | null;
            warehouseId: string;
            vehicleNumber: string | null;
            invoiceNumber: string | null;
            receivedDate: Date;
            poId: string | null;
            invoiceDate: Date | null;
            dcNumber: string | null;
            grnNumber: string;
            grnType: string;
            ipoId: string | null;
            landedCostId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            acceptedQty: number;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            landedCostPerUnit: number | null;
        }[];
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        dcNumber: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
    }>;
    create(dto: CreateGrnDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            acceptedQty: number;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            landedCostPerUnit: number | null;
        }[];
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        dcNumber: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
    }>;
    update(id: string, dto: UpdateGrnDto, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            acceptedQty: number;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            landedCostPerUnit: number | null;
        }[];
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        dcNumber: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
    }>;
    submit(id: string, req: any): Promise<{
        warehouse: {
            code: string;
            name: string;
        };
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            acceptedQty: number;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            landedCostPerUnit: number | null;
        }[];
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
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        dcNumber: string | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        landedCostId: string | null;
    }>;
}
