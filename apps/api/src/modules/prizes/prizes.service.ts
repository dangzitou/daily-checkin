import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrizeDto, UpdatePrizeDto } from './prizes.dto';

@Injectable()
export class PrizesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrizeDto) {
    return this.prisma.prize.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        pointsCost: dto.pointsCost,
        stock: dto.stock ?? 0,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.prize.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const prize = await this.prisma.prize.findUnique({
      where: { id },
    });
    if (!prize) {
      throw new NotFoundException('Prize not found');
    }
    return prize;
  }

  async update(id: number, dto: UpdatePrizeDto) {
    await this.findOne(id);
    return this.prisma.prize.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.prize.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async decrementStock(id: number) {
    return this.prisma.prize.update({
      where: { id },
      data: { stock: { decrement: 1 } },
    });
  }
}
