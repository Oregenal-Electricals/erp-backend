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
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            remarks: string | null;
            deliveryDate: Date;
            dcNumber: string;
            shortageQty: number;
            dispatchId: string;
            receiverName: string;
            receiverPhone: string | null;
            podNumber: string | null;
            condition: string;
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
                soNumber: string;
                cpo: {
                    cpoNumber: string;
                    customerPoNumber: string;
                };
            };
            vehicleNumber: string;
            dispatchNumber: string;
            lrNumber: string;
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
        remarks: string | null;
        deliveryDate: Date;
        dcNumber: string;
        shortageQty: number;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        damageNotes: string | null;
    }>;
    create(dto: CreateDeliveryConfirmationDto, req: any): Promise<{
        dispatch: {
            salesOrder: {
                customerName: string;
                soNumber: string;
                cpo: {
                    cpoNumber: string;
                    customerPoNumber: string;
                };
            };
            vehicleNumber: string;
            dispatchNumber: string;
            lrNumber: string;
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
        remarks: string | null;
        deliveryDate: Date;
        dcNumber: string;
        shortageQty: number;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        damageNotes: string | null;
    }>;
}
