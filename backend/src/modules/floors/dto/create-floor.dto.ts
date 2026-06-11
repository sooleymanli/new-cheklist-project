import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateFloorDto {
  @IsUUID()
  buildingId: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
