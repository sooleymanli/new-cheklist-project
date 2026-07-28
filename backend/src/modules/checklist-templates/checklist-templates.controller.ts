import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { QueryChecklistTemplateDto } from './dto/query-checklist-template.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Checklist Templates')
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(private readonly service: ChecklistTemplatesService) {}

  @Get()
  @Permissions('checklist-template.view')
  findAll(@Query() query: QueryChecklistTemplateDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('checklist-template.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('checklist-template.create')
  create(@Body() dto: CreateChecklistTemplateDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('checklist-template.update')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistTemplateDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('checklist-template.delete')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }

  @Patch(':id/activate')
  @Permissions('checklist-template.update')
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.activate(id, userId);
  }

  @Patch(':id/deactivate')
  @Permissions('checklist-template.update')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.deactivate(id, userId);
  }

  @Post(':id/duplicate')
  @Permissions('checklist-template.create')
  duplicate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.duplicate(id, userId);
  }
}
