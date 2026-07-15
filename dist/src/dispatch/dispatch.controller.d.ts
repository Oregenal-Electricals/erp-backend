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
    findOne(id: string, req: any): Promise<{
        items: {
            id: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            totalAmount: number;
            itemCode: string;
            itemName: string;
            gstRate: number;
            uom: string;
            unitPrice: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            planItemId: string | null;
            dispatchId: string;
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
        dispatchDate: Date;
        lrNumber: string | null;
        ewayBillNumber: string | null;
        dispatchNumber: string;
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
            totalAmount: number;
            itemCode: string;
            itemName: string;
            gstRate: number;
            uom: string;
            unitPrice: number;
            gstAmount: number;
            dispatchedQty: number;
            soItemId: string;
            planItemId: string | null;
            dispatchId: string;
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
        dispatchDate: Date;
        lrNumber: string | null;
        ewayBillNumber: string | null;
        dispatchNumber: string;
    }>;
}
