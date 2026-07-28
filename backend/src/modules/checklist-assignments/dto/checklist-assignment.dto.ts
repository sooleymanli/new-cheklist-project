import { IsUUID, IsOptional } from 'class-validator';

export class CreateChecklistAssignmentDto {
  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
