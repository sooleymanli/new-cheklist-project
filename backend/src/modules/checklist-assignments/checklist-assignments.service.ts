import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateChecklistAssignmentDto } from './dto/checklist-assignment.dto';

@Injectable()
export class ChecklistAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTemplate(templateId: string) {
    return this.prisma.checklistAssignment.findMany({
      where: { templateId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateChecklistAssignmentDto, userId: string) {
    if (!dto.userId && !dto.roleId) {
      throw new BadRequestException('checklistAssignment.userOrRoleRequired');
    }

    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id: dto.templateId, deletedAt: null },
    });
    if (!template) throw new NotFoundException('checklistTemplate.notFound');

    const assignment = await this.prisma.checklistAssignment.create({
      data: {
        templateId: dto.templateId,
        userId: dto.userId,
        roleId: dto.roleId,
        createdBy: userId,
      },
    });

    return { ...assignment, message: 'checklistAssignment.created' };
  }

  async remove(id: string) {
    const assignment = await this.prisma.checklistAssignment.findFirst({
      where: { id, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('checklistAssignment.notFound');

    await this.prisma.checklistAssignment.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'checklistAssignment.deleted' };
  }
}
