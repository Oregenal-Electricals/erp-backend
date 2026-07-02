import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
export declare class DispatchService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateDispatchDto, user: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            gstRate: number;
            uom: string;
            totalAmount: number;
            unitPrice: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            planItemId: string | null;
            dispatchId: string;
        }[];
        salesOrder: {
            customerName: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
            soNumber: string;
        };
        dispatchPlan: {
            transportMode: string;
            planNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        planId: string;
        dispatchDate: Date;
        lrNumber: string | null;
        ewayBillNumber: string | null;
        dispatchNumber: string;
    }>;
    findAll(user: any, query: any): Promise<{
        data: ({
            items: {
                id: string;
                itemCode: string;
                dispatchedQty: number;
            }[];
            salesOrder: {
                soNumber: string;
            };
            dispatchPlan: {
                planNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            status: string;
            vehicleNumber: string | null;
            remarks: string | null;
            driverName: string | null;
            customerName: string;
            deliveryAddress: string | null;
            soId: string;
            transporterName: string | null;
            driverPhone: string | null;
            planId: string;
            dispatchDate: Date;
            lrNumber: string | null;
            ewayBillNumber: string | null;
            dispatchNumber: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            itemCode: string;
            itemName: string;
            gstRate: number;
            uom: string;
            totalAmount: number;
            unitPrice: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            planItemId: string | null;
            dispatchId: string;
        }[];
        salesOrder: {
            customerName: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
            soNumber: string;
        };
        dispatchPlan: {
            transportMode: string;
            planNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        isActive: boolean;
        isTestData: boolean;
        companyId: string;
        status: string;
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        planId: string;
        dispatchDate: Date;
        lrNumber: string | null;
        ewayBillNumber: string | null;
        dispatchNumber: string;
    }>;
    getStats(user: any): Promise<{
        total: number;
        dispatched: number;
        delivered: number;
        cancelled: number;
        totalQtyDispatched: number;
    }>;
}
