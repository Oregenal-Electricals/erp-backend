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
                grnType: string;
                grnNumber: string;
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
            supplierName: string | null;
            grnId: string;
            inspectedBy: string | null;
            inspectionDate: Date;
            sampleSize: number | null;
            iqcNumber: string;
            templateId: string | null;
            lotQuantity: number | null;
            mrirNo: string | null;
            currentStage: string;
            finalOutcome: string;
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        inspectionDate: Date;
        sampleSize: number | null;
        iqcNumber: string;
        templateId: string | null;
        lotQuantity: number | null;
        mrirNo: string | null;
        currentStage: string;
        finalOutcome: string;
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        inspectionDate: Date;
        sampleSize: number | null;
        iqcNumber: string;
        templateId: string | null;
        lotQuantity: number | null;
        mrirNo: string | null;
        currentStage: string;
        finalOutcome: string;
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        inspectionDate: Date;
        sampleSize: number | null;
        iqcNumber: string;
        templateId: string | null;
        lotQuantity: number | null;
        mrirNo: string | null;
        currentStage: string;
        finalOutcome: string;
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        inspectionDate: Date;
        sampleSize: number | null;
        iqcNumber: string;
        templateId: string | null;
        lotQuantity: number | null;
        mrirNo: string | null;
        currentStage: string;
        finalOutcome: string;
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
            rejectionReason: string | null;
            receivedQty: number;
            acceptedQty: number;
            rejectedQty: number;
            iqcId: string;
            grnItemId: string;
        }[];
        grn: {
            warehouse: {
                name: string;
            };
            warehouseId: string;
            grnType: string;
            grnNumber: string;
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
        supplierName: string | null;
        grnId: string;
        inspectedBy: string | null;
        inspectionDate: Date;
        sampleSize: number | null;
        iqcNumber: string;
        templateId: string | null;
        lotQuantity: number | null;
        mrirNo: string | null;
        currentStage: string;
        finalOutcome: string;
    }>;
}
