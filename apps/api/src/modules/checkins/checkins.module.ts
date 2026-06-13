import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, TasksModule, PointsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService]
})
export class CheckinsModule {}
