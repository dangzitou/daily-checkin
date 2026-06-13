import { Body, Controller, Delete, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestWithUser } from '../auth/current-user';
import { CreateGoalDto } from './goals.dto';
import { GoalsService } from './goals.service';

@Controller('goals')
@UseGuards(AuthGuard)
export class GoalsController {
  constructor(@Inject(GoalsService) private readonly goals: GoalsService) {}

  @Get()
  list(@Req() request: RequestWithUser) {
    return this.goals.list(request.user.id);
  }

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateGoalDto) {
    return this.goals.create(request.user.id, dto);
  }

  @Delete(':id')
  delete(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.goals.deactivate(request.user.id, Number(id));
  }
}
