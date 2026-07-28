import { Module } from '@nestjs/common';
import { ChecklistAssignmentsController } from './checklist-assignments.controller';
import { ChecklistAssignmentsService } from './checklist-assignments.service';

@Module({
  controllers: [ChecklistAssignmentsController],
  providers: [ChecklistAssignmentsService],
  exports: [ChecklistAssignmentsService],
})
export class ChecklistAssignmentsModule {}
