import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryInspectionAssignmentDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
  recurrenceType?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
