import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { QueryChecklistTemplateDto } from './dto/query-checklist-template.dto';

@Injectable()
export class ChecklistTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryChecklistTemplateDto) {
    const { page = 1, pageSize = 10, search, sort = 'createdAt', order = 'desc', status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.checklistTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          fields: { where: { fieldType: 'table' }, select: { fieldConfig: true } },
          _count: { select: { fields: true, locations: true, instances: true } },
        },
      }),
      this.prisma.checklistTemplate.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        fields: { orderBy: { orderNo: 'asc' } },
        locations: { include: { location: { include: { building: true, floor: true } } } },
        _count: { select: { instances: true } },
      },
    });
    if (!template) throw new NotFoundException('checklistTemplate.notFound');
    return template;
  }

  async create(dto: CreateChecklistTemplateDto, userId: string) {
    const { fields, locationIds, ...templateData } = dto;

    const template = await this.prisma.checklistTemplate.create({
      data: {
        ...templateData,
        createdBy: userId,
        fields: fields?.length ? {
          create: fields.map((f) => ({
            orderNo: f.orderNo,
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            fieldType: f.fieldType,
            category: f.category || null,
            fieldConfig: (f.fieldConfig || {}) as unknown as Prisma.JsonObject,
          })),
        } : undefined,
        locations: locationIds?.length ? {
          create: locationIds.map((locationId) => ({ locationId })),
        } : undefined,
      },
      include: {
        fields: { orderBy: { orderNo: 'asc' } },
        locations: { include: { location: true } },
      },
    });

    return { ...template, message: 'checklistTemplate.created', messageParams: { name: template.name } };
  }

  async update(id: string, dto: UpdateChecklistTemplateDto, userId: string) {
    const existing = await this.findOne(id);
    const { fields, locationIds, ...templateData } = dto;

    // If changing status to active, ensure there's at least one field
    if (dto.status === 'active') {
      const fieldCount = fields?.length ?? existing.fields.length;
      if (fieldCount === 0) {
        throw new BadRequestException('checklistTemplate.noFields');
      }
    }

    const template = await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...templateData,
        updatedBy: userId,
        // Replace fields if provided
        ...(fields !== undefined && {
          fields: {
            deleteMany: {},
            create: fields.map((f) => ({
              orderNo: f.orderNo,
              fieldKey: f.fieldKey,
              fieldLabel: f.fieldLabel,
              fieldType: f.fieldType,
              category: f.category || null,
              fieldConfig: (f.fieldConfig || {}) as unknown as Prisma.JsonObject,
            })),
          },
        }),
        // Replace locations if provided
        ...(locationIds !== undefined && {
          locations: {
            deleteMany: {},
            create: locationIds.map((locationId) => ({ locationId })),
          },
        }),
      },
      include: {
        fields: { orderBy: { orderNo: 'asc' } },
        locations: { include: { location: true } },
      },
    });

    return { ...template, message: 'checklistTemplate.updated', messageParams: { name: template.name } };
  }

  async remove(id: string, userId: string) {
    const template = await this.findOne(id);
    await this.prisma.checklistTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
    return { message: 'checklistTemplate.deleted', messageParams: { name: template.name } };
  }

  async activate(id: string, userId: string) {
    const template = await this.findOne(id);
    if (template.fields.length === 0) {
      throw new BadRequestException('checklistTemplate.noFields');
    }
    const updated = await this.prisma.checklistTemplate.update({
      where: { id },
      data: { status: 'active', isActive: true, updatedBy: userId },
    });
    return { ...updated, message: 'checklistTemplate.activated', messageParams: { name: updated.name } };
  }

  async deactivate(id: string, userId: string) {
    await this.findOne(id);
    const updated = await this.prisma.checklistTemplate.update({
      where: { id },
      data: { status: 'inactive', isActive: false, updatedBy: userId },
    });
    return { ...updated, message: 'checklistTemplate.deactivated', messageParams: { name: updated.name } };
  }

  async duplicate(id: string, userId: string) {
    const template = await this.findOne(id);
    const newTemplate = await this.prisma.checklistTemplate.create({
      data: {
        name: `${template.name} (copy)`,
        description: template.description,
        status: 'draft',
        createdBy: userId,
        fields: {
          create: template.fields.map((f) => ({
            orderNo: f.orderNo,
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            fieldType: f.fieldType,
            category: f.category,
            fieldConfig: f.fieldConfig as any,
          })),
        },
        locations: {
          create: template.locations.map((l) => ({ locationId: l.locationId })),
        },
      },
      include: {
        fields: { orderBy: { orderNo: 'asc' } },
        locations: { include: { location: true } },
      },
    });
    return { ...newTemplate, message: 'checklistTemplate.duplicated', messageParams: { name: newTemplate.name } };
  }
}
