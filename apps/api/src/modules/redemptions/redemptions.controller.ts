import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/redemptions')
@UseGuards(AuthGuard)
export class RedemptionsController {
  constructor(private redemptionsService: RedemptionsService) {}

  @Post()
  async redeem(@Request() req, @Body('prizeId', ParseIntPipe) prizeId: number) {
    return this.redemptionsService.redeem(req.user.id, prizeId);
  }

  @Get('my')
  async getMyRedemptions(@Request() req) {
    return this.redemptionsService.getUserRedemptions(req.user.id);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async getAllRedemptions() {
    return this.redemptionsService.getAllRedemptions();
  }

  @Put(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.redemptionsService.updateStatus(id, status);
  }
}
