import { Module } from '@nestjs/common';
import { InspectionAssignmentsController } from './inspection-assignments.controller';
import { InspectionAssignmentsService } from './inspection-assignments.service';
import { InspectionSchedulerService } from './inspection-scheduler.service';

@Module({
  controllers: [InspectionAssignmentsController],
  providers: [InspectionAssignmentsService, InspectionSchedulerService],
  exports: [InspectionAssignmentsService],
})
export class InspectionAssignmentsModule {}
