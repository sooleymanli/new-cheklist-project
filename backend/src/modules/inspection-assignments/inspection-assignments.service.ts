import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateInspectionAssignmentDto } from './dto/create-inspection-assignment.dto';
import { UpdateInspectionAssignmentDto } from './dto/update-inspection-assignment.dto';
import { QueryInspectionAssignmentDto } from './dto/query-inspection-assignment.dto';

@Injectable()
export class InspectionAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryInspectionAssignmentDto) {
    const { page = 1, pageSize = 10, search, sort = 'createdAt', order = 'desc', templateId, isActive, recurrenceType, assigneeId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (templateId) where.templateId = templateId;
    if (isActive !== undefined) where.isActive = isActive;
    if (recurrenceType) where.recurrenceType = recurrenceType;
    if (assigneeId) where.assigneeIds = { has: assigneeId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { template: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inspectionAssignment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          template: { select: { id: true, name: true } },
          approvalSteps: { orderBy: { stepOrder: 'asc' } },
          _count: { select: { instances: true } },
        },
      }),
      this.prisma.inspectionAssignment.count({ where }),
    ]);

    // Enrich with assignee names
    const allAssigneeIds = [...new Set(data.flatMap((d) => d.assigneeIds))];
    const users = allAssigneeIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: allAssigneeIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedData = data.map((assignment) => ({
      ...assignment,
      templateName: assignment.template?.name,
      assignees: assignment.assigneeIds.map((id) => userMap.get(id)).filter(Boolean),
      approvalSteps: assignment.approvalSteps.map((step) => ({
        ...step,
        approverName: userMap.get(step.approverId)
          ? `${userMap.get(step.approverId)!.firstName} ${userMap.get(step.approverId)!.lastName}`
          : undefined,
      })),
    }));

    return {
      data: enrichedData,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const assignment = await this.prisma.inspectionAssignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        template: { select: { id: true, name: true } },
        approvalSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!assignment) throw new NotFoundException('inspectionAssignment.notFound');

    // Enrich assignees
    const users = await this.prisma.user.findMany({
      where: { id: { in: assignment.assigneeIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      ...assignment,
      templateName: assignment.template?.name,
      assignees: assignment.assigneeIds.map((id) => userMap.get(id)).filter(Boolean),
      approvalSteps: assignment.approvalSteps.map((step) => ({
        ...step,
        approverName: userMap.get(step.approverId)
          ? `${userMap.get(step.approverId)!.firstName} ${userMap.get(step.approverId)!.lastName}`
          : undefined,
      })),
    };
  }

  async create(dto: CreateInspectionAssignmentDto, userId: string) {
    // Verify template exists and is active
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id: dto.templateId, deletedAt: null, status: 'active' },
    });
    if (!template) throw new BadRequestException('checklistTemplate.notActiveOrNotFound');

    // Verify all assignees exist
    const assigneeCount = await this.prisma.user.count({
      where: { id: { in: dto.assigneeIds }, deletedAt: null, isActive: true },
    });
    if (assigneeCount !== dto.assigneeIds.length) {
      throw new BadRequestException('inspectionAssignment.invalidAssignees');
    }

    // One-time assignments require an explicit date.
    if (dto.recurrenceType === 'once' && !dto.scheduledDate) {
      throw new BadRequestException('inspectionAssignment.scheduledDateRequired');
    }

    const assignment = await this.prisma.inspectionAssignment.create({
      data: {
        name: dto.name,
        description: dto.description,
        templateId: dto.templateId,
        assigneeIds: dto.assigneeIds,
        recurrenceType: dto.recurrenceType,
        scheduledDate: dto.recurrenceType === 'once' && dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        customIntervalHours: dto.customIntervalHours,
        customIntervalType: dto.customIntervalType,
        customDateRangeStart: dto.customDateRangeStart ? new Date(dto.customDateRangeStart) : null,
        customDateRangeEnd: dto.customDateRangeEnd ? new Date(dto.customDateRangeEnd) : null,
        dateRangeIntervalHours: dto.dateRangeIntervalHours,
        excludeWeekends: dto.excludeWeekends,
        excludeHolidays: dto.excludeHolidays,
        excludeHolidayDates: dto.excludeHolidayDates?.map((d) => new Date(d)) || [],
        excludeVacationDates: dto.excludeVacationDates?.map((d) => new Date(d)) || [],
        timeWindowStart: dto.timeWindowStart,
        timeWindowEnd: dto.timeWindowEnd,
        requiresQrStart: dto.requiresQrStart,
        requiresApproval: dto.requiresApproval,
        createdBy: userId,
        approvalSteps: dto.approvalSteps?.length
          ? { create: dto.approvalSteps.map((s) => ({ stepOrder: s.stepOrder, approverId: s.approverId })) }
          : undefined,
      },
      include: {
        template: { select: { id: true, name: true } },
        approvalSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    // One-time assignments generate a single occurrence on the chosen date.
    // Recurring assignments generate the first occurrence now and schedule the next run.
    if (assignment.recurrenceType === 'once') {
      const dueAt = this.computeDueAtForDate(new Date(dto.scheduledDate!), assignment.timeWindowEnd);
      await this.generateChecklistInstances(assignment.id, dueAt);
    } else {
      const now = new Date();
      const dueAt = this.computeDueAtForDate(now, assignment.timeWindowEnd);
      if (!this.shouldSkip(assignment, now)) {
        await this.generateChecklistInstances(assignment.id, dueAt);
      }
      const nextRunAt = this.computeNextRunAt(assignment, now);
      await this.prisma.inspectionAssignment.update({
        where: { id: assignment.id },
        data: { lastRunAt: now, nextRunAt },
      });
    }

    return { ...assignment, message: 'inspectionAssignment.created', messageParams: { name: template.name } };
  }

  /**
   * Generate ChecklistInstance records for an assignment's current occurrence —
   * one instance per assignee. Designed to be reused by the future scheduler.
   */
  async generateChecklistInstances(assignmentId: string, dueDate?: Date) {
    const assignment = await this.prisma.inspectionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment || !assignment.isActive || assignment.deletedAt) return [];

    const dueAt = dueDate ?? this.computeDueAt(assignment.timeWindowEnd);

    const created = await this.prisma.$transaction(
      assignment.assigneeIds.map((assigneeId) =>
        this.prisma.checklistInstance.create({
          data: {
            templateId: assignment.templateId,
            assignmentId: assignment.id,
            assignedUserId: assigneeId,
            status: 'pending',
            dueAt,
          },
        }),
      ),
    );

    await this.prisma.checklistInstanceHistory.createMany({
      data: created.map((instance) => ({ instanceId: instance.id, action: 'created' })),
    });

    return created;
  }

  /** Build a due date for today using a HH:mm time window end. */
  private computeDueAt(timeWindowEnd: string): Date {
    return this.computeDueAtForDate(new Date(), timeWindowEnd);
  }

  /** Build a due date on a specific calendar day using a HH:mm time window end. */
  private computeDueAtForDate(date: Date, timeWindowEnd: string): Date {
    const due = new Date(date);
    const [hours, minutes] = (timeWindowEnd || '23:59').split(':').map((v) => parseInt(v, 10));
    due.setHours(Number.isNaN(hours) ? 23 : hours, Number.isNaN(minutes) ? 59 : minutes, 0, 0);
    return due;
  }

  /** Whether a given calendar day should be skipped based on the assignment's exclusions. */
  private shouldSkip(assignment: any, date: Date): boolean {
    if (assignment.excludeWeekends) {
      const day = date.getDay();
      if (day === 0 || day === 6) return true;
    }
    const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const target = ymd(date);
    if (assignment.excludeHolidays && (assignment.excludeHolidayDates as Date[])?.some((d) => ymd(new Date(d)) === target)) {
      return true;
    }
    if ((assignment.excludeVacationDates as Date[])?.some((d) => ymd(new Date(d)) === target)) {
      return true;
    }
    return false;
  }

  /**
   * Compute the next generation time for a recurring assignment based on its
   * recurrence type, advancing past excluded weekends. Returns null when the
   * recurrence has ended (e.g. a custom date range that is exhausted).
   */
  private computeNextRunAt(assignment: any, from: Date): Date | null {
    const next = new Date(from);
    switch (assignment.recurrenceType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'custom': {
        if (assignment.customIntervalType === 'hourly' && assignment.customIntervalHours) {
          next.setHours(next.getHours() + assignment.customIntervalHours);
        } else {
          next.setDate(next.getDate() + 1);
        }
        if (assignment.customDateRangeEnd && next > new Date(assignment.customDateRangeEnd)) {
          return null;
        }
        break;
      }
      default:
        return null;
    }

    if (assignment.excludeWeekends) {
      let guard = 0;
      while ((next.getDay() === 0 || next.getDay() === 6) && guard < 7) {
        next.setDate(next.getDate() + 1);
        guard += 1;
      }
    }
    return next;
  }

  /**
   * Generate instances for a recurring assignment whose nextRunAt is due, then
   * advance nextRunAt to the following occurrence. Called by the scheduler.
   */
  async runScheduledGeneration(assignmentId: string, now: Date = new Date()) {
    const assignment = await this.prisma.inspectionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (
      !assignment ||
      !assignment.isActive ||
      assignment.deletedAt ||
      assignment.recurrenceType === 'once' ||
      !assignment.nextRunAt ||
      assignment.nextRunAt > now
    ) {
      return;
    }

    const runDate = assignment.nextRunAt;
    if (!this.shouldSkip(assignment, runDate)) {
      const dueAt = this.computeDueAtForDate(runDate, assignment.timeWindowEnd);
      await this.generateChecklistInstances(assignment.id, dueAt);
    }

    const nextRunAt = this.computeNextRunAt(assignment, runDate);
    await this.prisma.inspectionAssignment.update({
      where: { id: assignment.id },
      data: { lastRunAt: now, nextRunAt },
    });
  }

  async update(id: string, dto: UpdateInspectionAssignmentDto, userId: string) {
    await this.findOne(id);

    const { approvalSteps, scheduledDate, customDateRangeStart, customDateRangeEnd, excludeHolidayDates, excludeVacationDates, ...rest } = dto;

    const assignment = await this.prisma.inspectionAssignment.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledDate !== undefined && { scheduledDate: scheduledDate ? new Date(scheduledDate) : null }),
        ...(customDateRangeStart !== undefined && { customDateRangeStart: customDateRangeStart ? new Date(customDateRangeStart) : null }),
        ...(customDateRangeEnd !== undefined && { customDateRangeEnd: customDateRangeEnd ? new Date(customDateRangeEnd) : null }),
        ...(excludeHolidayDates !== undefined && { excludeHolidayDates: excludeHolidayDates.map((d) => new Date(d)) }),
        ...(excludeVacationDates !== undefined && { excludeVacationDates: excludeVacationDates.map((d) => new Date(d)) }),
        updatedBy: userId,
        ...(approvalSteps !== undefined && {
          approvalSteps: {
            deleteMany: {},
            create: approvalSteps.map((s) => ({ stepOrder: s.stepOrder, approverId: s.approverId })),
          },
        }),
      },
      include: {
        template: { select: { id: true, name: true } },
        approvalSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    return { ...assignment, message: 'inspectionAssignment.updated', messageParams: { name: assignment.template?.name } };
  }

  async remove(id: string, userId: string) {
    const assignment = await this.findOne(id);
    await this.prisma.inspectionAssignment.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId, isActive: false },
    });
    return { message: 'inspectionAssignment.deleted', messageParams: { name: assignment.templateName } };
  }

  // ─── INSTANCES ──────────────────────────────────────────────────────────────

  async getApprovalHistory(instanceId: string) {
    const instance = await this.prisma.inspectionInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new NotFoundException('inspectionInstance.notFound');

    const history = await this.prisma.inspectionApprovalHistory.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich approver names
    const approverIds = [...new Set(history.map((h) => h.approverId))];
    const users = approverIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: approverIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return history.map((h) => ({
      ...h,
      approverName: userMap.get(h.approverId)
        ? `${userMap.get(h.approverId)!.firstName} ${userMap.get(h.approverId)!.lastName}`
        : undefined,
    }));
  }
}
