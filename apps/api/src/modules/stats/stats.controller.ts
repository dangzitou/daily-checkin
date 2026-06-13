import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
  constructor(@Inject(StatsService) private readonly stats: StatsService) {}

  @Get('summary')
  summary(@Req() request: RequestWithUser) {
    return this.stats.summary(request.user.id);
  }
}
