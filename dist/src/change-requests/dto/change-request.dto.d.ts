import { ChangeRequestType } from '@prisma/client';
export declare class CreateChangeRequestDto {
    title: string;
    description: string;
    type: ChangeRequestType;
    priority?: string;
    dueDate?: string;
}
export declare class UpdateChangeRequestDto {
    title?: string;
    description?: string;
    type?: ChangeRequestType;
    priority?: string;
    dueDate?: string;
}
export declare class ReviewChangeRequestDto {
    reviewComment: string;
}
export declare class AddCommentDto {
    comment: string;
}
