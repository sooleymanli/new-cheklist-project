import { IsString, IsOptional, IsIn, IsUUID, IsDateString, IsArray, IsInt, IsBoolean, Min, Max } from 'class-validator';

export class CreateChecklistScheduleDto {
  @IsUUID()
  templateId: string;

  @IsString()
  @IsIn(['one_time', 'daily', 'weekly', 'monthly', 'quarterly'])
  frequency: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  dueTime?: string; // HH:mm

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[]; // 1-7 for weekly

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number; // 1-31 for monthly
}

export class UpdateChecklistScheduleDto {
  @IsOptional()
  @IsString()
  @IsIn(['one_time', 'daily', 'weekly', 'monthly', 'quarterly'])
  frequency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  dueTime?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
