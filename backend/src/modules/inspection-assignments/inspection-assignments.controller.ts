import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { InspectionAssignmentsService } from './inspection-assignments.service';
import { CreateInspectionAssignmentDto } from './dto/create-inspection-assignment.dto';
import { UpdateInspectionAssignmentDto } from './dto/update-inspection-assignment.dto';
import { QueryInspectionAssignmentDto } from './dto/query-inspection-assignment.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Inspection Assignments')
@Controller('inspection-assignments')
export class InspectionAssignmentsController {
  constructor(private readonly service: InspectionAssignmentsService) {}

  @Get()
  @Permissions('checklist-template.view')
  findAll(@Query() query: QueryInspectionAssignmentDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('checklist-template.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('checklist-template.assign')
  create(@Body() dto: CreateInspectionAssignmentDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('checklist-template.assign')
  update(@Param('id') id: string, @Body() dto: UpdateInspectionAssignmentDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('checklist-template.assign')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }

  @Get('instances/:instanceId/approval-history')
  @Permissions('checklist-instance.view')
  getApprovalHistory(@Param('instanceId') instanceId: string) {
    return this.service.getApprovalHistory(instanceId);
  }
}
