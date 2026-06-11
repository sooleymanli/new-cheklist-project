import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { users: true, permissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllSelect() {
    return this.prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findPermissions(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('role.notFound');
    return role.permissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) throw new NotFoundException('role.notFound');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('role.nameExists');

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
    return { ...role, message: 'role.created' };
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.role.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) throw new ConflictException('role.nameExists');
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: dto,
    });
    return { ...role, message: 'role.updated' };
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('role.notFound');
    if (role._count.users > 0) {
      throw new ConflictException('role.hasUsers');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'role.deleted' };
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    await this.findOne(id);

    // Remove existing and reassign
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    await this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      })),
    });

    return { message: 'role.permissionsUpdated' };
  }
}
