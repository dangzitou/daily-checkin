import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CheckinsModule } from '../checkins/checkins.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule, CheckinsModule],
  controllers: [StatsController],
  providers: [StatsService]
})
export class StatsModule {}
