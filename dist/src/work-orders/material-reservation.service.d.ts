import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
export declare class MaterialReservationService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    reserveForWorkOrder(workOrderId: string, user: any): Promise<any[]>;
    findForWorkOrder(workOrderId: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        itemCode: string;
        itemName: string;
        warehouseId: string;
        reservedQty: number;
        releasedReason: string | null;
        workOrderId: string;
    }[]>;
    findAll(user: any, query: any): Promise<({
        workOrder: {
            status: string;
            priority: string;
            woNumber: string;
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
        itemCode: string;
        itemName: string;
        warehouseId: string;
        reservedQty: number;
        releasedReason: string | null;
        workOrderId: string;
    })[]>;
}
