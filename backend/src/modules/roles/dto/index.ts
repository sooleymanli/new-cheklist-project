import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Supervisor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Supervises inspections' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Supervisor' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], example: ['user.view', 'user.create'] })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}
