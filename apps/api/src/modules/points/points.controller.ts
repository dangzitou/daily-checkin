import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PointsService } from './points.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/points')
@UseGuards(AuthGuard)
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    const balance = await this.pointsService.getBalance(req.user.id);
    return { balance };
  }

  @Get('logs')
  async getLogs(@Request() req) {
    const logs = await this.pointsService.getLogs(req.user.id);
    return { logs };
  }
}
