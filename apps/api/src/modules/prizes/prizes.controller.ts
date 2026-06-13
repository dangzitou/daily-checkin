import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrizesService } from './prizes.service';
import { CreatePrizeDto, UpdatePrizeDto } from './prizes.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('prizes')
export class PrizesController {
  constructor(private prizesService: PrizesService) {}

  @Get()
  async findAll() {
    return this.prizesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prizesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  async create(@Body() dto: CreatePrizeDto) {
    return this.prizesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrizeDto,
  ) {
    return this.prizesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prizesService.remove(id);
  }
}
