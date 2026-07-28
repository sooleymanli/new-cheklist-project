import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryChecklistTemplateDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status?: string;
}
