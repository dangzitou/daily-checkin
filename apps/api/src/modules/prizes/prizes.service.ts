import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  /**
   * 在已有事务中扣减库存，使用 WHERE stock > 0 防止负库存。
   */
  async decrementStockTx(tx: Prisma.TransactionClient, id: number) {
    const updated = await tx.$executeRaw`
      UPDATE Prize SET stock = stock - 1 WHERE id = ${id} AND stock > 0
    `;
    if (updated === 0) {
      throw new BadRequestException('奖品库存不足');
    }
  }
}
