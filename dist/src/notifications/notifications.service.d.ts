import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateNotificationDto, companyId: string, createdBy: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        priority: string;
        referenceNumber: string | null;
        referenceId: string | null;
        referenceType: string | null;
        userId: string;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    createBulk(notifications: CreateNotificationDto[], companyId: string, createdBy: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    notifyCompany(companyId: string, type: string, title: string, message: string, opts?: any): Promise<void>;
    findAll(userId: string, companyId: string, query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            priority: string;
            referenceNumber: string | null;
            referenceId: string | null;
            referenceType: string | null;
            userId: string;
            type: string;
            title: string;
            message: string;
            isRead: boolean;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
        unreadCount: number;
    }>;
    markRead(userId: string, companyId: string, ids?: string[]): Promise<{
        message: string;
        unreadCount: number;
    }>;
    getUnreadCount(userId: string, companyId: string): Promise<{
        unreadCount: number;
    }>;
    deleteOld(userId: string, companyId: string): Promise<{
        message: string;
    }>;
    onSalesOrderCreated(so: any, companyId: string, userId: string): Promise<void>;
    onInvoiceOverdue(invoice: any, companyId: string): Promise<void>;
    onCreditHold(hold: any, companyId: string, userId: string): Promise<void>;
    onDispatchCreated(dispatch: any, companyId: string, userId: string): Promise<void>;
    onPaymentReceived(payment: any, invoice: any, companyId: string, userId: string): Promise<void>;
}
