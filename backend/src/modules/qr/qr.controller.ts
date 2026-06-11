import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { QrService } from './qr.service';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
import type { Request } from 'express';

@ApiTags('QR Codes')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @Permissions('qr.generate')
  generate(@Body() dto: GenerateQrDto, @CurrentUser('id') userId: string) {
    return this.qrService.generate(dto.entityType, dto.entityId, userId);
  }

  @Post('scan')
  @Permissions('qr.scan')
  scan(@Body() dto: ScanQrDto, @CurrentUser('id') userId: string, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.qrService.scan(dto.code, userId, ipAddress);
  }

  @Get(':id/image')
  @Permissions('qr.generate')
  getImage(@Param('id') id: string) {
    return this.qrService.getQrImage(id);
  }

  @Get('entity/:entityType/:entityId')
  @Permissions('qr.generate')
  findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.qrService.findByEntity(entityType, entityId);
  }
}
