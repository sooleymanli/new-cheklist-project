import { IsString, IsUUID, IsIn } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  @IsIn(['building', 'floor', 'location'])
  entityType: string;

  @IsUUID()
  entityId: string;
}
