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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            status: string;
            remarks: string | null;
            grnId: string;
            inspectionDate: Date;
            iqcNumber: string;
            inspectedBy: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            acceptedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    })[]>;
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
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            acceptedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
    create(dto: CreateIqcDto, req: any): Promise<{
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
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            acceptedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
    updateItems(id: string, dto: UpdateIqcItemsDto, req: any): Promise<{
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
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            acceptedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
    approve(id: string, req: any): Promise<{
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
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            acceptedQty: number;
            grnItemId: string;
            iqcId: string;
        }[];
        grn: {
            warehouseId: string;
            warehouse: {
                name: string;
            };
            grnNumber: string;
            grnType: string;
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
        grnId: string;
        inspectionDate: Date;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
}
