import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, pageSize = 10, search, sort = 'createdAt', order = 'desc' } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { floors: { some: { name: { contains: search, mode: 'insensitive' }, deletedAt: null } } },
        { locations: { some: { name: { contains: search, mode: 'insensitive' }, deletedAt: null } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.building.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          _count: { select: { floors: true, locations: true } },
        },
      }),
      this.prisma.building.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const building = await this.prisma.building.findFirst({
      where: { id, deletedAt: null },
      include: {
        floors: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        _count: { select: { floors: true, locations: true } },
      },
    });
    if (!building) throw new NotFoundException('building.notFound');
    return building;
  }

  async create(dto: CreateBuildingDto, userId: string) {
    const building = await this.prisma.building.create({
      data: { ...dto, createdBy: userId },
    });
    return { ...building, message: 'building.created', messageParams: { name: building.name } };
  }

  async update(id: string, dto: UpdateBuildingDto, userId: string) {
    await this.findOne(id);
    const building = await this.prisma.building.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
    return { ...building, message: 'building.updated', messageParams: { name: building.name } };
  }

  async remove(id: string, userId: string) {
    const building = await this.findOne(id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.building.update({ where: { id }, data: { deletedAt: now, deletedBy: userId } }),
      this.prisma.floor.updateMany({ where: { buildingId: id, deletedAt: null }, data: { deletedAt: now, deletedBy: userId } }),
      this.prisma.location.updateMany({ where: { buildingId: id, deletedAt: null }, data: { deletedAt: now, deletedBy: userId } }),
    ]);
    return { message: 'building.deleted', messageParams: { name: building.name } };
  }

  async activate(id: string, userId: string) {
    await this.findOne(id);
    const building = await this.prisma.building.update({ where: { id }, data: { isActive: true, updatedBy: userId } });
    return { ...building, message: 'building.activated', messageParams: { name: building.name } };
  }

  async deactivate(id: string, userId: string) {
    await this.findOne(id);
    const building = await this.prisma.building.update({ where: { id }, data: { isActive: false, updatedBy: userId } });
    return { ...building, message: 'building.deactivated', messageParams: { name: building.name } };
  }
}
