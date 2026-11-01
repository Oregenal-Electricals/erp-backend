import { IsString, IsNumber, IsDateString, Min, IsOptional } from 'class-validator';

// Supervisor's request for authorized overtime on a line/Work Order -
// see schema.prisma's OvertimeRequest model comment for why this is a
// separate document from ManpowerAllocation/ManpowerAssignment.
export class CreateOvertimeRequestDto {
  @IsString() workOrderId: string;
  @IsDateString() shiftDate: string;
  @IsNumber() @Min(1) requestedMenCount: number;
  @IsNumber() @Min(0.5) requestedHours: number;
  @IsString() reason: string;
}

// Management (final-level approver) reducing the requested men/hours
// before approving - same requested-vs-approved shape as
// AdditionalMaterialRequest/MaterialIssueOverride elsewhere in this
// codebase. Both optional: either can be adjusted independently, and
// omitting both simply confirms the requested figures as-is.
export class AdjustOvertimeRequestDto {
  @IsOptional() @IsNumber() @Min(1) approvedMenCount?: number;
  @IsOptional() @IsNumber() @Min(0.5) approvedHours?: number;
}
