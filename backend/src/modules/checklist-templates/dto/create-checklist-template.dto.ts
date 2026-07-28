import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min, IsIn, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTemplateFieldDto {
  @IsInt()
  @Min(0)
  orderNo: number;

  @IsString()
  fieldKey: string;

  @IsString()
  fieldLabel: string;

  @IsString()
  fieldType: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  fieldConfig?: any;
}

export class CreateChecklistTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateFieldDto)
  fields?: CreateTemplateFieldDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];
}
