import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateChecklistScheduleDto, UpdateChecklistScheduleDto } from './dto/checklist-schedule.dto';

@Injectable()
export class ChecklistSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTemplate(templateId: string) {
    return this.prisma.checklistSchedule.findMany({
      where: { templateId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.checklistSchedule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!schedule) throw new NotFoundException('checklistSchedule.notFound');
    return schedule;
  }

  async create(dto: CreateChecklistScheduleDto, userId: string) {
    // Verify template is active
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id: dto.templateId, deletedAt: null, status: 'active' },
    });
    if (!template) throw new BadRequestException('checklistTemplate.notActiveOrNotFound');

    const schedule = await this.prisma.checklistSchedule.create({
      data: {
        templateId: dto.templateId,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        dueTime: dto.dueTime,
        daysOfWeek: dto.daysOfWeek || [],
        dayOfMonth: dto.dayOfMonth,
        createdBy: userId,
      },
    });

    return { ...schedule, message: 'checklistSchedule.created', messageParams: { name: template.name } };
  }

  async update(id: string, dto: UpdateChecklistScheduleDto, userId: string) {
    await this.findOne(id);
    const schedule = await this.prisma.checklistSchedule.update({
      where: { id },
      data: {
        ...(dto.frequency && { frequency: dto.frequency }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.dueTime !== undefined && { dueTime: dto.dueTime }),
        ...(dto.daysOfWeek && { daysOfWeek: dto.daysOfWeek }),
        ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return { ...schedule, message: 'checklistSchedule.updated' };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.checklistSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'checklistSchedule.deleted' };
  }

  async activate(id: string) {
    await this.findOne(id);
    const schedule = await this.prisma.checklistSchedule.update({
      where: { id },
      data: { isActive: true },
    });
    return { ...schedule, message: 'checklistSchedule.activated' };
  }

  async deactivate(id: string) {
    await this.findOne(id);
    const schedule = await this.prisma.checklistSchedule.update({
      where: { id },
      data: { isActive: false },
    });
    return { ...schedule, message: 'checklistSchedule.deactivated' };
  }
}
