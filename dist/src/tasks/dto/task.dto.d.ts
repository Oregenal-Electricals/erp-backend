export declare class CreateTaskDto {
    title: string;
    description?: string;
    assignedTo: string;
    dueDate: string;
    priority?: string;
    category?: string;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    assignedTo?: string;
    dueDate?: string;
    priority?: string;
    category?: string;
}
export declare class UpdateTaskStatusDto {
    status: string;
    completionNote?: string;
}
export declare class AddCommentDto {
    comment: string;
}
