import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async set(key: string, value: any, ttl?: number) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, val, 'EX', ttl);
    } else {
      await this.client.set(key, val);
    }
  }

  async get(key: string): Promise<any> {
    const val = await this.client.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
