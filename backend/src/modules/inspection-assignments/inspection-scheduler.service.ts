import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/prisma.service';
import { InspectionAssignmentsService } from './inspection-assignments.service';

@Injectable()
export class InspectionSchedulerService {
  private readonly logger = new Logger(InspectionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: InspectionAssignmentsService,
  ) {}

  /**
   * Runs every hour and generates checklist instances for any recurring
   * inspection assignment whose next scheduled run is due.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateDueInstances() {
    const now = new Date();
    const due = await this.prisma.inspectionAssignment.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        recurrenceType: { not: 'once' },
        nextRunAt: { not: null, lte: now },
      },
      select: { id: true },
    });

    if (!due.length) return;

    this.logger.log(`Generating instances for ${due.length} recurring assignment(s)`);
    for (const assignment of due) {
      try {
        await this.assignments.runScheduledGeneration(assignment.id, now);
      } catch (err) {
        this.logger.error(`Failed to generate instances for assignment ${assignment.id}`, err as Error);
      }
    }
  }
}
