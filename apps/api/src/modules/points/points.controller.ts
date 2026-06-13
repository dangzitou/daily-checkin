import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PointsService } from './points.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('points')
@UseGuards(AuthGuard)
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('balance')
  async getBalance(@Request() req: any) {
    const balance = await this.pointsService.getBalance(req.user.id);
    return { balance };
  }

  @Get('logs')
  async getLogs(@Request() req: any) {
    const logs = await this.pointsService.getLogs(req.user.id);
    return { logs };
  }
}
