export declare class WorkflowStepDto {
    level: number;
    stepName: string;
    approverUserId?: string;
    timeoutHours?: number;
}
export declare class CreateWorkflowDto {
    name: string;
    documentType: string;
    triggerCondition?: string;
    triggerAmount?: number;
    description?: string;
    steps: WorkflowStepDto[];
}
export declare class SubmitForApprovalDto {
    documentType: string;
    documentId: string;
    documentNumber: string;
    amount?: number;
    remarks?: string;
}
export declare class ApproveRejectDto {
    action: string;
    comments?: string;
}
