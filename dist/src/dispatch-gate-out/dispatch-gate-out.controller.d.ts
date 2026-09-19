import { DispatchGateOutService } from './dispatch-gate-out.service';
import { ConfirmGateOutDto } from './dto/dispatch-gate-out.dto';
export declare class DispatchGateOutController {
    private readonly gateOutService;
    constructor(gateOutService: DispatchGateOutService);
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
            qty: number;
            warehouseId: string | null;
            saleType: string;
            soItemId: string;
            workOrderId: string | null;
            dispatchReservationId: string | null;
            gateOutId: string;
            packageId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        dispatchConfirmation: {
            confirmationNumber: string;
            confirmationType: string;
        };
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
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
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        gateOutNumber: string;
        dispatchConfirmationId: string;
        gateOutAt: Date;
        gateOutBy: string | null;
    }>;
    confirmGateOut(dto: ConfirmGateOutDto, req: any): Promise<{
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
            qty: number;
            warehouseId: string | null;
            saleType: string;
            soItemId: string;
            workOrderId: string | null;
            dispatchReservationId: string | null;
            gateOutId: string;
            packageId: string;
        }[];
        salesOrder: {
            customerName: string;
            soNumber: string;
        };
        dispatchPlan: {
            planNumber: string;
        };
        dispatchConfirmation: {
            confirmationNumber: string;
            confirmationType: string;
        };
        transportAssignment: {
            vehicleNumber: string;
            transporterName: string;
            assignmentNumber: string;
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
        customerName: string;
        soId: string;
        dispatchPlanId: string;
        transportAssignmentId: string;
        gateOutNumber: string;
        dispatchConfirmationId: string;
        gateOutAt: Date;
        gateOutBy: string | null;
    }>;
}
