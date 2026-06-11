import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(buildingId?: string, floorId?: string) {
    const where: any = { deletedAt: null };
    if (buildingId) where.buildingId = buildingId;
    if (floorId) where.floorId = floorId;

    return this.prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        building: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      include: {
        building: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
      },
    });
    if (!location) throw new NotFoundException('location.notFound');
    return location;
  }

  async create(dto: CreateLocationDto, userId: string) {
    const location = await this.prisma.location.create({
      data: { ...dto, createdBy: userId },
    });
    return { ...location, message: 'location.created', messageParams: { name: location.name } };
  }

  async update(id: string, dto: UpdateLocationDto, userId: string) {
    await this.findOne(id);
    const location = await this.prisma.location.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
    return { ...location, message: 'location.updated', messageParams: { name: location.name } };
  }

  async remove(id: string, userId: string) {
    const location = await this.findOne(id);
    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
    return { message: 'location.deleted', messageParams: { name: location.name } };
  }

  async activate(id: string, userId: string) {
    await this.findOne(id);
    const location = await this.prisma.location.update({ where: { id }, data: { isActive: true, updatedBy: userId } });
    return { ...location, message: 'location.activated', messageParams: { name: location.name } };
  }

  async deactivate(id: string, userId: string) {
    await this.findOne(id);
    const location = await this.prisma.location.update({ where: { id }, data: { isActive: false, updatedBy: userId } });
    return { ...location, message: 'location.deactivated', messageParams: { name: location.name } };
  }
}
