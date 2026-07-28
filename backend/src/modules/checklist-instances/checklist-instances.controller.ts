import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ChecklistInstancesService } from './checklist-instances.service';
import { SubmitChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { QueryChecklistInstanceDto } from './dto/query-checklist-instance.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Checklist Instances')
@Controller('checklist-instances')
export class ChecklistInstancesController {
  constructor(private readonly service: ChecklistInstancesService) {}

  @Get()
  @Permissions('checklist-instance.view-all', 'checklist-instance.view-approver')
  findAll(@Query() query: QueryChecklistInstanceDto, @CurrentUser() user: any) {
    if (user?.permissions?.includes('checklist-instance.view-all')) {
      return this.service.findAll(query);
    }
    // view-approver: only instances where this user is in the approval chain
    return this.service.findAllForApprover(user.id, query);
  }

  @Get('my')
  @Permissions('checklist-instance.submit')
  myInstances(@CurrentUser('id') userId: string, @Query() query: QueryChecklistInstanceDto) {
    return this.service.myInstances(userId, query);
  }

  @Get(':id')
  @Permissions('checklist-instance.view-all', 'checklist-instance.view-approver', 'checklist-instance.submit')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @Permissions('checklist-instance.view-all', 'checklist-instance.view-approver', 'checklist-instance.submit')
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }

  @Post(':id/start')
  @Permissions('checklist-instance.submit')
  start(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.start(id, userId);
  }

  @Post(':id/save')
  @Permissions('checklist-instance.submit')
  saveDraft(@Param('id') id: string, @Body() dto: SubmitChecklistInstanceDto, @CurrentUser('id') userId: string) {
    return this.service.saveDraft(id, dto, userId);
  }

  @Post(':id/submit')
  @Permissions('checklist-instance.submit')
  submit(@Param('id') id: string, @Body() dto: SubmitChecklistInstanceDto, @CurrentUser('id') userId: string) {
    return this.service.submit(id, dto, userId);
  }

  @Post(':id/approve')
  @Permissions('checklist-instance.approve-own', 'checklist-instance.approve-all')
  approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
    @Body() body: { comment?: string },
  ) {
    const canApproveAll = permissions?.includes('checklist-instance.approve-all');
    return this.service.approve(id, userId, body?.comment, canApproveAll);
  }

  @Post(':id/reject')
  @Permissions('checklist-instance.reject-own', 'checklist-instance.reject-all')
  reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
    @Body() body: { comment?: string },
  ) {
    const canRejectAll = permissions?.includes('checklist-instance.reject-all');
    return this.service.reject(id, userId, body?.comment, canRejectAll);
  }
}
