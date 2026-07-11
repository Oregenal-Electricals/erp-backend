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
            inspectionDate: Date;
            grnId: string;
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
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            grnItemId: string;
            iqcId: string;
            acceptedQty: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        inspectionDate: Date;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            grnItemId: string;
            iqcId: string;
            acceptedQty: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        inspectionDate: Date;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            grnItemId: string;
            iqcId: string;
            acceptedQty: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        inspectionDate: Date;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            grnItemId: string;
            iqcId: string;
            acceptedQty: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        inspectionDate: Date;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
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
            itemCode: string;
            itemName: string;
            uom: string;
            rejectedQty: number;
            receivedQty: number;
            rejectionReason: string | null;
            grnItemId: string;
            iqcId: string;
            acceptedQty: number;
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
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        remarks: string | null;
        inspectionDate: Date;
        grnId: string;
        iqcNumber: string;
        inspectedBy: string | null;
    }>;
}
