import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsUUID()
  buildingId: string;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
