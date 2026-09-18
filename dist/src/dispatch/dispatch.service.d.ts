import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { StockLedgerService } from '../stock-ledger/stock-ledger.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
export declare class DispatchService {
    private prisma;
    private audit;
    private stockLedger;
    constructor(prisma: PrismaService, audit: AuditService, stockLedger: StockLedgerService);
    private generateNumber;
    private includes;
    create(dto: CreateDispatchDto, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            totalAmount: number;
            unitPrice: number;
            gstRate: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            dispatchId: string;
            planItemId: string | null;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
        };
        dispatchPlan: {
            transportMode: string;
            planNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        planId: string;
        lrNumber: string | null;
        dispatchNumber: string;
        dispatchDate: Date;
        ewayBillNumber: string | null;
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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
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
            lrNumber: string | null;
            dispatchNumber: string;
            dispatchDate: Date;
            ewayBillNumber: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            totalAmount: number;
            unitPrice: number;
            gstRate: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            dispatchId: string;
            planItemId: string | null;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
        };
        dispatchPlan: {
            transportMode: string;
            planNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        planId: string;
        lrNumber: string | null;
        dispatchNumber: string;
        dispatchDate: Date;
        ewayBillNumber: string | null;
    }>;
    markDelivered(id: string, user: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            itemCode: string;
            itemName: string;
            uom: string;
            totalAmount: number;
            unitPrice: number;
            gstRate: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            dispatchId: string;
            planItemId: string | null;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
            cpo: {
                customerPoNumber: string;
                cpoNumber: string;
            };
        };
        dispatchPlan: {
            transportMode: string;
            planNumber: string;
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
        vehicleNumber: string | null;
        remarks: string | null;
        driverName: string | null;
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        transporterName: string | null;
        driverPhone: string | null;
        planId: string;
        lrNumber: string | null;
        dispatchNumber: string;
        dispatchDate: Date;
        ewayBillNumber: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        dispatched: number;
        delivered: number;
        cancelled: number;
        totalQtyDispatched: number;
    }>;
}
