import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/notification.dto';
export declare class NotificationsController {
    private readonly notifService;
    constructor(notifService: NotificationsService);
    getUnreadCount(req: any): Promise<{
        unreadCount: number;
    }>;
    findAll(req: any, query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            isActive: boolean;
            isTestData: boolean;
            companyId: string;
            type: string;
            title: string;
            priority: string;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            userId: string;
            message: string;
            isRead: boolean;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
        unreadCount: number;
    }>;
    markRead(req: any, dto: MarkReadDto): Promise<{
        message: string;
        unreadCount: number;
    }>;
    clearOld(req: any): Promise<{
        message: string;
    }>;
}
