import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateAlertTemplateDto, UpdateAlertTemplateDto, TriggerAlertDto } from './dto/alert.dto';
export declare class AlertsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private renderTemplate;
    seedDefaultTemplates(companyId: string, userId: string): Promise<{
        message: string;
        count: number;
    }>;
    trigger(dto: TriggerAlertDto, companyId: string, userId: string): Promise<{
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
    createTemplate(dto: CreateAlertTemplateDto, user: any): Promise<{
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
    updateTemplate(id: string, dto: UpdateAlertTemplateDto, user: any): Promise<{
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
    findAllTemplates(user: any): Promise<{
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
    findAllLogs(user: any, query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            referenceType: string | null;
            referenceId: string | null;
            referenceNumber: string | null;
            eventType: string;
            channel: string;
            subject: string | null;
            recipient: string;
            body: string;
            errorMessage: string | null;
            sentAt: Date | null;
            templateId: string | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getStats(user: any): Promise<{
        total: number;
        sent: number;
        failed: number;
        pending: number;
        activeTemplates: number;
    }>;
}
