import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ChecklistSchedulesService } from './checklist-schedules.service';
import { CreateChecklistScheduleDto, UpdateChecklistScheduleDto } from './dto/checklist-schedule.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Checklist Schedules')
@Controller('checklist-schedules')
export class ChecklistSchedulesController {
  constructor(private readonly service: ChecklistSchedulesService) {}

  @Get()
  @Permissions('checklist-template.view')
  findAllByTemplate(@Query('templateId') templateId: string) {
    return this.service.findAllByTemplate(templateId);
  }

  @Get(':id')
  @Permissions('checklist-template.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('checklist-template.update')
  create(@Body() dto: CreateChecklistScheduleDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('checklist-template.update')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistScheduleDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('checklist-template.update')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/activate')
  @Permissions('checklist-template.update')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('checklist-template.update')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
