import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDeliveryConfirmationDto } from './dto/delivery-confirmation.dto';
export declare class DeliveryConfirmationService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private generateNumber;
    private includes;
    create(dto: CreateDeliveryConfirmationDto, user: any): Promise<{
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
        shortageQty: number;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        damageNotes: string | null;
    }>;
    findAll(user: any, query: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
        shortageQty: number;
        dispatchId: string;
        receiverName: string;
        receiverPhone: string | null;
        podNumber: string | null;
        condition: string;
        damageNotes: string | null;
    }>;
    getStats(user: any): Promise<{
        total: number;
        good: number;
        damaged: number;
        partial: number;
    }>;
}
