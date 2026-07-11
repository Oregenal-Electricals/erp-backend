import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
export declare class DispatchController {
    private readonly dispatchService;
    constructor(dispatchService: DispatchService);
    getStats(req: any): Promise<{
        total: number;
        dispatched: number;
        delivered: number;
        cancelled: number;
        totalQtyDispatched: number;
    }>;
    findAll(req: any, query: any): Promise<{
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
            remarks: string | null;
            customerName: string;
            deliveryAddress: string | null;
            soId: string;
            dispatchNumber: string;
            planId: string;
            dispatchDate: Date;
            vehicleNumber: string | null;
            transporterName: string | null;
            driverName: string | null;
            driverPhone: string | null;
            lrNumber: string | null;
            ewayBillNumber: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
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
            dispatchId: string;
            planItemId: string | null;
            soItemId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
        dispatchPlan: {
            planNumber: string;
            transportMode: string;
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
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        dispatchNumber: string;
        planId: string;
        dispatchDate: Date;
        vehicleNumber: string | null;
        transporterName: string | null;
        driverName: string | null;
        driverPhone: string | null;
        lrNumber: string | null;
        ewayBillNumber: string | null;
    }>;
    create(dto: CreateDispatchDto, req: any): Promise<{
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
            dispatchId: string;
            planItemId: string | null;
            soItemId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
            cpo: {
                cpoNumber: string;
                customerPoNumber: string;
            };
        };
        dispatchPlan: {
            planNumber: string;
            transportMode: string;
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
        customerName: string;
        deliveryAddress: string | null;
        soId: string;
        dispatchNumber: string;
        planId: string;
        dispatchDate: Date;
        vehicleNumber: string | null;
        transporterName: string | null;
        driverName: string | null;
        driverPhone: string | null;
        lrNumber: string | null;
        ewayBillNumber: string | null;
    }>;
}
