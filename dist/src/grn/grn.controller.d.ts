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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            remarks: string | null;
            warehouseId: string;
            vehicleNumber: string | null;
            invoiceNumber: string | null;
            receivedDate: Date;
            poId: string | null;
            invoiceDate: Date | null;
            grnNumber: string;
            grnType: string;
            ipoId: string | null;
            gateInwardEntryId: string | null;
            landedCostId: string | null;
            dcNumber: string | null;
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            landedCostPerUnit: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        gateInwardEntryId: string | null;
        landedCostId: string | null;
        dcNumber: string | null;
    }>;
    create(dto: CreateGrnDto, req: any): Promise<{
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            landedCostPerUnit: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        gateInwardEntryId: string | null;
        landedCostId: string | null;
        dcNumber: string | null;
    }>;
    update(id: string, dto: UpdateGrnDto, req: any): Promise<{
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            landedCostPerUnit: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        gateInwardEntryId: string | null;
        landedCostId: string | null;
        dcNumber: string | null;
    }>;
    submit(id: string, req: any): Promise<{
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
            totalValue: number;
            uom: string;
            rejectedQty: number;
            unitPrice: number;
            orderedQty: number;
            receivedQty: number;
            grnId: string;
            poItemId: string | null;
            ipoItemId: string | null;
            previouslyReceived: number;
            acceptedQty: number;
            landedCostPerUnit: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        status: string;
        remarks: string | null;
        warehouseId: string;
        vehicleNumber: string | null;
        invoiceNumber: string | null;
        receivedDate: Date;
        poId: string | null;
        invoiceDate: Date | null;
        grnNumber: string;
        grnType: string;
        ipoId: string | null;
        gateInwardEntryId: string | null;
        landedCostId: string | null;
        dcNumber: string | null;
    }>;
}
