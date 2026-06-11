import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationQueryDto } from '../../shared/dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto & { status?: string; roleId?: string }) {
    const { page = 1, pageSize = 20, search, sort = 'createdAt', order = 'desc', status, roleId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (roleId) where.roleId = roleId;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          position: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        position: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('user.notFound');
    return user;
  }

  async create(dto: CreateUserDto, createdBy?: string) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (existing) throw new ConflictException('user.emailExists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        mobile: dto.mobile,
        position: dto.position,
        roleId: dto.roleId,
        passwordHash: hashedPassword,
        createdBy,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        position: true,
        isActive: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
    return { ...user, message: 'user.created' };
  }

  async update(id: string, dto: UpdateUserDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id }, deletedAt: null },
      });
      if (existing) throw new ConflictException('user.emailExists');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { ...dto, updatedBy },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        position: true,
        isActive: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
    return { ...user, message: 'user.updated' };
  }

  async remove(id: string, deletedBy?: string) {
    const user = await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        email: `${user.email}_deleted_${Date.now()}`,
      },
    });
    return { message: 'user.deleted' };
  }

  async activate(id: string, updatedBy?: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true, updatedBy },
      select: { id: true, isActive: true },
    });
    return { ...user, message: 'user.activated' };
  }

  async deactivate(id: string, updatedBy?: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false, updatedBy },
      select: { id: true, isActive: true },
    });
    return { ...user, message: 'user.deactivated' };
  }
}
