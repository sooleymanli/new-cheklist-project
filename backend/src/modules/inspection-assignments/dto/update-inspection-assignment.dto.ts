import { PartialType } from '@nestjs/mapped-types';
import { CreateInspectionAssignmentDto } from './create-inspection-assignment.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateInspectionAssignmentDto extends PartialType(CreateInspectionAssignmentDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
