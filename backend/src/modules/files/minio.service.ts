import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';
import minioConfig from '../../config/minio.config';

@Injectable()
export class MinioService {
  private client: Minio.Client;
  private bucket: string;

  constructor(@Inject(minioConfig.KEY) private config: Record<string, any>) {
    this.client = new Minio.Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
    this.ensureBucket();
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async upload(file: Express.Multer.File, path: string): Promise<{ bucket: string; path: string }> {
    await this.client.putObject(this.bucket, path, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return { bucket: this.bucket, path };
  }

  async getSignedUrl(path: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, path, expirySeconds);
  }

  async delete(path: string): Promise<void> {
    await this.client.removeObject(this.bucket, path);
  }
}
