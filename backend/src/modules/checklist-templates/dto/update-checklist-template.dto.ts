import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateChecklistTemplateDto } from './create-checklist-template.dto';

export class UpdateChecklistTemplateDto extends PartialType(CreateChecklistTemplateDto) {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'inactive'])
  status?: string;
}
