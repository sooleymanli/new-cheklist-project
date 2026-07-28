import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { MinioService } from './minio.service';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async upload(file: Express.Multer.File, entityType?: string, entityId?: string, userId?: string) {
    const ext = path.extname(file.originalname);
    const fileName = `${uuid()}${ext}`;
    const filePath = entityType ? `${entityType}/${fileName}` : `general/${fileName}`;

    const { bucket, path: storedPath } = await this.minio.upload(file, filePath);

    const record = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        bucket,
        path: storedPath,
        entityType,
        entityId,
        uploadedBy: userId,
      },
    });

    return record;
  }

  async findOne(id: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, deletedAt: null },
    });
    if (!file) throw new NotFoundException('file.notFound');
    return file;
  }

  async getUrl(id: string) {
    const file = await this.findOne(id);
    const url = await this.minio.getSignedUrl(file.path);
    return { ...file, url };
  }

  async remove(id: string) {
    const file = await this.findOne(id);
    await this.minio.delete(file.path);
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'file.deleted' };
  }
}
