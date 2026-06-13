import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
  }

  async get(key: string) {
    await this.connect();
    return this.client.get(key);
  }

  async setex(key: string, seconds: number, value: string) {
    await this.connect();
    return this.client.setex(key, seconds, value);
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }

  private async connect() {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }
}
