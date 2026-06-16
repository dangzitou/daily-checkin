import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CheckinsModule } from './checkins/checkins.module';
import { GoalsModule } from './goals/goals.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RemindersModule } from './reminders/reminders.module';
import { StatsModule } from './stats/stats.module';
import { TasksModule } from './tasks/tasks.module';
import { PointsModule } from './points/points.module';
import { PrizesModule } from './prizes/prizes.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { FeedModule } from './feed/feed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 60,   // 60 requests per minute (global default)
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    TasksModule,
    CheckinsModule,
    GoalsModule,
    StatsModule,
    RemindersModule,
    PointsModule,
    PrizesModule,
    RedemptionsModule,
    FeedModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
