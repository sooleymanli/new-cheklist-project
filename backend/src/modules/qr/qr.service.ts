import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(entityType: string, entityId: string, userId: string) {
    // Verify entity exists
    await this.verifyEntity(entityType, entityId);

    // Check if QR already exists for this entity
    const existing = await this.prisma.qrCode.findFirst({
      where: { entityType, entityId, isActive: true },
    });
    if (existing) return existing;

    const code = `FI-${entityType.toUpperCase()}-${randomUUID().slice(0, 8)}`;
    return this.prisma.qrCode.create({
      data: { entityType, entityId, code, createdBy: userId },
    });
  }

  async scan(code: string, userId?: string, ipAddress?: string) {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { code },
    });
    if (!qrCode || !qrCode.isActive) throw new NotFoundException('QR code not found or inactive');

    // Log the scan
    await this.prisma.qrScanLog.create({
      data: { qrCodeId: qrCode.id, userId, ipAddress },
    });

    // Return entity data
    const entity = await this.getEntity(qrCode.entityType, qrCode.entityId);
    return { qrCode, entityType: qrCode.entityType, entity };
  }

  async getQrImage(id: string): Promise<string> {
    const qrCode = await this.prisma.qrCode.findUnique({ where: { id } });
    if (!qrCode) throw new NotFoundException('QR code not found');

    // Generate QR code as data URL (base64 PNG)
    const dataUrl = await QRCode.toDataURL(qrCode.code, { width: 300, margin: 2 });
    return dataUrl;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.qrCode.findFirst({
      where: { entityType, entityId, isActive: true },
    });
  }

  private async verifyEntity(entityType: string, entityId: string) {
    let entity: any;
    switch (entityType) {
      case 'building':
        entity = await this.prisma.building.findFirst({ where: { id: entityId, deletedAt: null } });
        break;
      case 'floor':
        entity = await this.prisma.floor.findFirst({ where: { id: entityId, deletedAt: null } });
        break;
      case 'location':
        entity = await this.prisma.location.findFirst({ where: { id: entityId, deletedAt: null } });
        break;
      default:
        throw new NotFoundException(`Unknown entity type: ${entityType}`);
    }
    if (!entity) throw new NotFoundException(`${entityType} not found`);
    return entity;
  }

  private async getEntity(entityType: string, entityId: string) {
    switch (entityType) {
      case 'building':
        return this.prisma.building.findFirst({ where: { id: entityId, deletedAt: null } });
      case 'floor':
        return this.prisma.floor.findFirst({
          where: { id: entityId, deletedAt: null },
          include: { building: { select: { id: true, name: true } } },
        });
      case 'location':
        return this.prisma.location.findFirst({
          where: { id: entityId, deletedAt: null },
          include: {
            building: { select: { id: true, name: true } },
            floor: { select: { id: true, name: true } },
          },
        });
      default:
        return null;
    }
  }
}
