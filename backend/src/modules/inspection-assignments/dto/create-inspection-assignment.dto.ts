import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  IsDateString,
  ValidateNested,
  IsUUID,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovalStepDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsInt()
  @Min(1)
  stepOrder: number;

  @IsUUID()
  approverId: string;
}

export class CreateInspectionAssignmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  templateId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  assigneeIds: string[];

  @IsString()
  @IsIn(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
  recurrenceType: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customIntervalHours?: number;

  @IsOptional()
  @IsString()
  @IsIn(['hourly', 'dateRange'])
  customIntervalType?: string;

  @IsOptional()
  @IsDateString()
  customDateRangeStart?: string;

  @IsOptional()
  @IsDateString()
  customDateRangeEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dateRangeIntervalHours?: number;

  @IsBoolean()
  excludeWeekends: boolean;

  @IsBoolean()
  excludeHolidays: boolean;

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  excludeHolidayDates?: string[];

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  excludeVacationDates?: string[];

  @IsString()
  timeWindowStart: string;

  @IsString()
  timeWindowEnd: string;

  @IsBoolean()
  requiresQrStart: boolean;

  @IsBoolean()
  requiresApproval: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  approvalSteps?: ApprovalStepDto[];
}
