import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';

@Module({
  imports: [AuthModule, TasksModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService]
})
export class CheckinsModule {}
