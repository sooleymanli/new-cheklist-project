import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

@Injectable()
export class FloorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(buildingId?: string) {
    const where: any = { deletedAt: null };
    if (buildingId) where.buildingId = buildingId;

    return this.prisma.floor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        building: { select: { id: true, name: true } },
        _count: { select: { locations: true } },
      },
    });
  }

  async findOne(id: string) {
    const floor = await this.prisma.floor.findFirst({
      where: { id, deletedAt: null },
      include: {
        building: { select: { id: true, name: true } },
        locations: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
      },
    });
    if (!floor) throw new NotFoundException('floor.notFound');
    return floor;
  }

  async create(dto: CreateFloorDto, userId: string) {
    const floor = await this.prisma.floor.create({
      data: { ...dto, createdBy: userId },
    });
    return { ...floor, message: 'floor.created', messageParams: { name: floor.name } };
  }

  async update(id: string, dto: UpdateFloorDto, userId: string) {
    await this.findOne(id);
    const floor = await this.prisma.floor.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
    return { ...floor, message: 'floor.updated', messageParams: { name: floor.name } };
  }

  async remove(id: string, userId: string) {
    const floor = await this.findOne(id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.floor.update({ where: { id }, data: { deletedAt: now, deletedBy: userId } }),
      this.prisma.location.updateMany({ where: { floorId: id, deletedAt: null }, data: { deletedAt: now, deletedBy: userId } }),
    ]);
    return { message: 'floor.deleted', messageParams: { name: floor.name } };
  }

  async activate(id: string, userId: string) {
    await this.findOne(id);
    const floor = await this.prisma.floor.update({ where: { id }, data: { isActive: true, updatedBy: userId } });
    return { ...floor, message: 'floor.activated', messageParams: { name: floor.name } };
  }

  async deactivate(id: string, userId: string) {
    await this.findOne(id);
    const floor = await this.prisma.floor.update({ where: { id }, data: { isActive: false, updatedBy: userId } });
    return { ...floor, message: 'floor.deactivated', messageParams: { name: floor.name } };
  }
}
