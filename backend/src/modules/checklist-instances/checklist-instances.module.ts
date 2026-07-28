import { Module } from '@nestjs/common';
import { ChecklistInstancesController } from './checklist-instances.controller';
import { ChecklistInstancesService } from './checklist-instances.service';

@Module({
  controllers: [ChecklistInstancesController],
  providers: [ChecklistInstancesService],
  exports: [ChecklistInstancesService],
})
export class ChecklistInstancesModule {}
