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
    markRead(req: any, dto: MarkReadDto): Promise<{
        message: string;
        unreadCount: number;
    }>;
    clearOld(req: any): Promise<{
        message: string;
    }>;
}
