import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { CreateTaskDto, ListTasksQueryDto, SkipTaskDto, UpdateTaskDto } from './tasks.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasks: TasksService) {}

  @Get()
  list(@Req() request: RequestWithUser, @Query() query: ListTasksQueryDto) {
    return this.tasks.list(request.user.id, query.date);
  }

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(request.user.id, dto);
  }

  @Patch(':id')
  update(@Req() request: RequestWithUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(request.user.id, id, dto);
  }

  @Delete(':id')
  delete(@Req() request: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.tasks.deactivate(request.user.id, id);
  }

  /** 跳过某天任务（今天不做这个，但不删除任务本身） */
  @Post(':id/skip')
  skipDate(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SkipTaskDto,
  ) {
    return this.tasks.skipDate(request.user.id, id, dto.date);
  }

  /** 取消跳过 */
  @Delete(':id/skip')
  unskipDate(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SkipTaskDto,
  ) {
    return this.tasks.unskipDate(request.user.id, id, query.date);
  }
}
