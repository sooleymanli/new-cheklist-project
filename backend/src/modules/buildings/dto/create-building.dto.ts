import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
