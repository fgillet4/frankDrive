import { Client } from 'minio';
import { config } from '../config.js';

export class StorageService {
  private client: Client;
  private bucket: string;

  constructor() {
    this.client = new Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    this.bucket = config.minio.bucket;
  }

  async initialize() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
      console.log(`✅ Created MinIO bucket: ${this.bucket}`);
    } else {
      console.log(`✅ MinIO bucket already exists: ${this.bucket}`);
    }
  }

  async uploadFile(
    objectKey: string,
    stream: NodeJS.ReadableStream,
    size: number,
    metadata?: Record<string, string>
  ) {
    await this.client.putObject(
      this.bucket,
      objectKey,
      stream,
      size,
      metadata
    );
    return objectKey;
  }

  async getFile(objectKey: string) {
    return await this.client.getObject(this.bucket, objectKey);
  }

  async deleteFile(objectKey: string) {
    await this.client.removeObject(this.bucket, objectKey);
  }

  async getFileUrl(objectKey: string, expiresIn: number = 3600) {
    return await this.client.presignedGetObject(
      this.bucket,
      objectKey,
      expiresIn
    );
  }

  async getUploadUrl(objectKey: string, expiresIn: number = 3600) {
    return await this.client.presignedPutObject(
      this.bucket,
      objectKey,
      expiresIn
    );
  }
}

export const storageService = new StorageService();
