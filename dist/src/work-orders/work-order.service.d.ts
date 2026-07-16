import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
export declare class WorkOrderService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateWorkOrderDto, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            warehouse: {
                name: string;
                code: string;
            };
            bom: {
                status: string;
                version: string;
                bomNumber: string;
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
            priority: string;
            remarks: string | null;
            uom: string;
            warehouseId: string;
            bomId: string | null;
            rejectedQty: number;
            productCode: string;
            productName: string;
            plannedQty: number;
            plannedStartDate: Date;
            plannedEndDate: Date;
            completedQty: number;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            woNumber: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
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
                quantity: number;
                notes: string | null;
                itemType: string;
                sequence: number;
                rawMaterialId: string | null;
                wastagePercent: number | null;
                unitCost: number | null;
                isCritical: boolean;
                totalCost: number | null;
                bomId: string;
                effectiveQty: number;
            }[];
        } & {
            id: string;
            companyId: string;
            description: string | null;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            productId: string;
            revisionId: string | null;
            version: string;
            effectiveFrom: Date;
            effectiveTo: Date | null;
            bomNumber: string;
            totalCost: number | null;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    update(id: string, dto: UpdateWorkOrderDto, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    release(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    start(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    complete(id: string, dto: {
        completedQty: number;
        rejectedQty?: number;
    }, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    cancel(id: string, user: any): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        bom: {
            status: string;
            version: string;
            bomNumber: string;
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
        priority: string;
        remarks: string | null;
        uom: string;
        warehouseId: string;
        bomId: string | null;
        rejectedQty: number;
        productCode: string;
        productName: string;
        plannedQty: number;
        plannedStartDate: Date;
        plannedEndDate: Date;
        completedQty: number;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        woNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        draft: number;
        released: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        totalPlanned: number;
        totalCompleted: number;
        totalRejected: number;
    }>;
}
