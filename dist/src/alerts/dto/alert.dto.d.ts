export declare class CreateAlertTemplateDto {
    eventType: string;
    channel?: string;
    subject: string;
    bodyTemplate: string;
    recipients?: string;
    recipientEmails?: string;
}
export declare class UpdateAlertTemplateDto {
    subject?: string;
    bodyTemplate?: string;
    recipients?: string;
    recipientEmails?: string;
    isActive?: boolean;
}
export declare class TriggerAlertDto {
    eventType: string;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    variables?: Record<string, string>;
}
