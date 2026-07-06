import { AlertsService } from './alerts.service';
import { CreateAlertTemplateDto, UpdateAlertTemplateDto, TriggerAlertDto } from './dto/alert.dto';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    getStats(req: any): Promise<{
        total: number;
        sent: number;
        failed: number;
        pending: number;
        activeTemplates: number;
    }>;
    findAllTemplates(req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        eventType: string;
        channel: string;
        subject: string;
        bodyTemplate: string;
        recipients: string;
        recipientEmails: string | null;
    }[]>;
    findAllLogs(req: any, query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            status: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            referenceNumber: string | null;
            referenceId: string | null;
            referenceType: string | null;
            eventType: string;
            channel: string;
            subject: string | null;
            templateId: string | null;
            recipient: string;
            body: string;
            errorMessage: string | null;
            sentAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    seed(req: any): Promise<{
        message: string;
        count: number;
    }>;
    trigger(dto: TriggerAlertDto, req: any): Promise<{
        sent: boolean;
        reason: string;
        recipientCount?: undefined;
        eventType?: undefined;
    } | {
        sent: boolean;
        recipientCount: number;
        eventType: string;
        reason?: undefined;
    }>;
    createTemplate(dto: CreateAlertTemplateDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        eventType: string;
        channel: string;
        subject: string;
        bodyTemplate: string;
        recipients: string;
        recipientEmails: string | null;
    }>;
    updateTemplate(id: string, dto: UpdateAlertTemplateDto, req: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        eventType: string;
        channel: string;
        subject: string;
        bodyTemplate: string;
        recipients: string;
        recipientEmails: string | null;
    }>;
}
