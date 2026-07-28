import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ChecklistAssignmentsService } from './checklist-assignments.service';
import { CreateChecklistAssignmentDto } from './dto/checklist-assignment.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Checklist Assignments')
@Controller('checklist-assignments')
export class ChecklistAssignmentsController {
  constructor(private readonly service: ChecklistAssignmentsService) {}

  @Get()
  @Permissions('checklist-template.view')
  findAll(@Query('templateId') templateId: string) {
    return this.service.findAllByTemplate(templateId);
  }

  @Post()
  @Permissions('checklist-template.assign')
  create(@Body() dto: CreateChecklistAssignmentDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Delete(':id')
  @Permissions('checklist-template.assign')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
