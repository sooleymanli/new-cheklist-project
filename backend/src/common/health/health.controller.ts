import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma.service';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const services: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = 'ok';
    } catch {
      services.database = 'error';
    }

    const allOk = Object.values(services).every((s) => s === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
