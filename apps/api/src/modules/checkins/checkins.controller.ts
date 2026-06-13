import { Controller, Delete, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { CheckinsService } from './checkins.service';

@Controller()
@UseGuards(AuthGuard)
export class CheckinsController {
  constructor(@Inject(CheckinsService) private readonly checkins: CheckinsService) {}

  @Post('tasks/:id/checkins/today')
  checkToday(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.checkins.checkToday(request.user.id, Number(id));
  }

  @Delete('tasks/:id/checkins/today')
  uncheckToday(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.checkins.uncheckToday(request.user.id, Number(id));
  }

  @Post('tasks/:id/checkins')
  checkOnDate(@Req() request: RequestWithUser, @Param('id') id: string, @Query('date') date: string) {
    return this.checkins.checkOnDate(request.user.id, Number(id), date);
  }

  @Delete('tasks/:id/checkins')
  uncheckOnDate(@Req() request: RequestWithUser, @Param('id') id: string, @Query('date') date: string) {
    return this.checkins.uncheckOnDate(request.user.id, Number(id), date);
  }

  @Get('checkins/calendar')
  calendar(@Req() request: RequestWithUser, @Query('month') month: string) {
    return this.checkins.calendar(request.user.id, month);
  }
}
