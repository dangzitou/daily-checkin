import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { describe, expect, it, beforeAll } from 'vitest';
import { AppModule } from './app.module';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-ci';
  });

  it('compiles with guards and module dependencies wired', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
