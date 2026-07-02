import { DeliveryConfirmationService } from './delivery-confirmation.service';
import { CreateDeliveryConfirmationDto } from './dto/delivery-confirmation.dto';
export declare class DeliveryConfirmationController {
    private readonly dcService;
    constructor(dcService: DeliveryConfirmationService);
    getStats(req: any): Promise<{
        total: number;
        good: number;
        damaged: number;
        partial: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: ({
            dispatch: {
                salesOrder: {
                    customerName: string;
                    soNumber: string;
                };
                vehicleNumber: string;
                dispatchNumber: string;
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
            remarks: string | null;
            deliveryDate: Date;
            dcNumber: string;
            dispatchId: string;
            receiverName: string;
            receiverPhone: string | null;
            podNumber: string | null;
            condition: string;
            shortageQty: number;
            damageNotes: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, req: any): Promise<{
        dispatch: {
            salesOrder: {
                customerName: string;
                cpo: {
                    customerPoNumber: string;
                    cpoNumber: string;
                };
                soNumber: string;
            };
            vehicleNumber: string;
            lrNumber: string;
            dispatchNumber: string;
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
        remarks: string | null;
        deliveryDate: Date;
        dcNumber: string;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        shortageQty: number;
        damageNotes: string | null;
    }>;
    create(dto: CreateDeliveryConfirmationDto, req: any): Promise<{
        dispatch: {
            salesOrder: {
                customerName: string;
                cpo: {
                    customerPoNumber: string;
                    cpoNumber: string;
                };
                soNumber: string;
            };
            vehicleNumber: string;
            lrNumber: string;
            dispatchNumber: string;
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
        remarks: string | null;
        deliveryDate: Date;
        dcNumber: string;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        shortageQty: number;
        damageNotes: string | null;
    }>;
}
