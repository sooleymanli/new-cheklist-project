import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';

export class QueryChecklistInstanceDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'overdue'])
  status?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
  frequency?: string;
}
