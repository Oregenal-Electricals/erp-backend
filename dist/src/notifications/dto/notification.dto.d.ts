export declare class CreateNotificationDto {
    userId: string;
    type: string;
    title: string;
    message: string;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    priority?: string;
}
export declare class MarkReadDto {
    ids?: string[];
}
