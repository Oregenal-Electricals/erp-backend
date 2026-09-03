import { IsString, IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';

const LEVELS = ['HR_TO_PLANT', 'PLANT_TO_STAGE', 'STAGE_TO_LINE'];

export class CreateManpowerAllocationDto {
  @IsDateString() date: string;
  @IsIn(LEVELS) level: string;
  @IsOptional() @IsString() category?: string;
  @IsString() toUserId: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsInt() @Min(1) count?: number; // ignored for HR_TO_PLANT - always computed from Attendance
  @IsOptional() @IsString() remarks?: string;
}

export class DistributeManpowerDto {
  @IsString() parentId: string;
  lines: {
    toUserId?: string;
    workOrderId?: string;
    category?: string;
    count: number;
    remarks?: string;
    shiftId?: string;
    lineId?: string;
    skillCategory?: string;
    startTime?: string;
    plannedEndTime?: string;
  }[];
}

export class RaiseManpowerQueryDto {
  @IsString() allocationId: string;
  @IsString() message: string;
}

export class ResolveManpowerQueryDto {
  @IsString() response: string;
}

export class AdjustManpowerDto {
  @IsString() allocationId: string;
  @IsInt() delta: number; // positive = increase, negative = decrease
  @IsOptional() @IsString() reason?: string;
}

export class TransferManpowerDto {
  @IsString() allocationId: string;
  @IsString() toWorkOrderId: string;
  @IsInt() @Min(1) qty: number;
  // PROD-008: reason is mandatory (spec section 31) - "Other" still
  // requires a real reason string, no separate remarks field needed.
  @IsString() reason: string;
  // Optional - when omitted, the transfer takes effect now. When
  // provided, this becomes the source-of-truth boundary for costing
  // (spec sections 3, 9): before it, manpower belongs to the source;
  // from it onward, to the destination.
  @IsOptional() @IsDateString() effectiveAt?: string;
}

// ---- Phase 1: employee-level assignment ----

const ACTIVITY_TYPES = [
  'PRODUCTION', 'QUALITY_INSPECTION', 'REWORK', 'REPAIR', 'MACHINE_SETUP',
  'LINE_CHANGEOVER', 'MAINTENANCE', 'BREAKDOWN_SUPPORT', 'MATERIAL_HANDLING',
  'STORE', 'INVENTORY_COUNTING', 'PACKING', 'DISPATCH_SUPPORT', 'LOADING_UNLOADING',
  'TRAINING', 'MEETING', 'CLEANING_5S', 'TRIAL_PRODUCTION', 'SAMPLE_PRODUCTION',
  'TEA_BREAK', 'LUNCH_BREAK', 'APPROVED_WAITING', 'OTHER_APPROVED',
];

export class AssignEmployeesDto {
  @IsString({ each: true }) employeeIds: string[];
  @IsOptional() @IsString() allocationId?: string;
  @IsOptional() @IsString() workOrderId?: string;
  @IsOptional() @IsString() stageName?: string;
  @IsOptional() @IsIn(ACTIVITY_TYPES) activityType?: string;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() plannedEndTime?: string;
  @IsOptional() @IsString() remarks?: string;
}

export class EndAssignmentDto {
  @IsOptional() @IsDateString() endTime?: string;
}
