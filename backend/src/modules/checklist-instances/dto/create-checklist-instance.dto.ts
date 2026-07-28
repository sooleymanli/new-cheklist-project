import { IsUUID, IsOptional, IsDateString, IsArray, IsString } from 'class-validator';

export class CreateChecklistInstanceDto {
  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class SubmitChecklistInstanceDto {
  @IsOptional()
  @IsArray()
  responses?: SubmitResponseDto[];
}

export class SubmitResponseDto {
  @IsUUID()
  fieldId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}
