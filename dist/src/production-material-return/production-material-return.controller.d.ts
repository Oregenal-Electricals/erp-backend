import { ProductionMaterialReturnService } from './production-material-return.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';
export declare class ProductionMaterialReturnController {
    private service;
    constructor(service: ProductionMaterialReturnService);
    getPreviousMaterialStatus(workOrderId: string, req: any): Promise<{
        workOrderId: string;
        woNumber: string;
        items: {
            standardConsumed: number;
            returnedQty: number;
            accountedQty: number;
            outstandingQty: number;
            status: string;
            itemCode: string;
            itemName: string;
            uom: string;
            issuedQty: number;
        }[];
        overallStatus: string;
    }>;
    create(dto: CreateMaterialReturnDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        reason: string;
        remarks: string | null;
        itemCode: string;
        itemName: string;
        uom: string;
        qty: number;
        warehouseId: string;
        returnedAt: Date;
        workOrderId: string;
        returnNumber: string;
        returnedById: string;
    }>;
}
