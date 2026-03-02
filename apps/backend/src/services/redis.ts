import { createClient } from 'redis';
import { config } from '../config.js';

class RedisService {
  private client;

  constructor() {
    this.client = createClient({
      url: config.redis.url,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to Redis');
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expiresIn?: number) {
    if (expiresIn) {
      await this.client.setEx(key, expiresIn, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string) {
    await this.client.del(key);
  }

  async exists(key: string) {
    return (await this.client.exists(key)) === 1;
  }
}

export const redisService = new RedisService();
