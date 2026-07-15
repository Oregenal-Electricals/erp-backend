import { IqcService } from './iqc.service';
import { CreateIqcDto, UpdateIqcItemsDto } from './dto/iqc.dto';
export declare class IqcController {
    private readonly iqcService;
    constructor(iqcService: IqcService);
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        approved: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            _count: {
                items: number;
            };
            grn: {
                warehouse: {
                    name: string;
                };
                grnNumber: string;
                grnType: string;
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
            grnId: string;
            iqcNumber: string;
            inspectedBy: string | null;
            inspectionDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByGrn(grnId: string, req: any): Promise<({
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    })[]>;
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
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    create(dto: CreateIqcDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    updateItems(id: string, dto: UpdateIqcItemsDto, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
    approve(id: string, req: any): Promise<{
        items: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            rejectionReason: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
        inspectionDate: Date;
    }>;
}
