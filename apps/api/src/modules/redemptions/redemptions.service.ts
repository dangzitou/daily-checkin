import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { PrizesService } from '../prizes/prizes.service';

@Injectable()
export class RedemptionsService {
  constructor(
    private prisma: PrismaService,
    private pointsService: PointsService,
    private prizesService: PrizesService,
  ) {}

  async redeem(userId: number, prizeId: number) {
    const prize = await this.prizesService.findOne(prizeId);

    if (!prize.isActive) {
      throw new BadRequestException('奖品已下架');
    }

    if (prize.stock <= 0) {
      throw new BadRequestException('奖品库存不足');
    }

    const balance = await this.pointsService.getBalance(userId);
    if (balance < prize.pointsCost) {
      throw new BadRequestException('积分不足');
    }

    // Execute redemption in transaction — all operations use the same tx for atomicity
    const redemption = await this.prisma.$transaction(async (tx) => {
      // Deduct points within the transaction
      await this.pointsService.deductPointsTx(
        tx,
        userId,
        prize.pointsCost,
        `兑换奖品：${prize.name}`,
      );

      // Decrement stock within the transaction (with stock > 0 guard)
      await this.prizesService.decrementStockTx(tx, prizeId);

      // Create redemption record
      return tx.redemption.create({
        data: {
          userId,
          prizeId,
          pointsCost: prize.pointsCost,
          status: 'completed',
        },
        include: { prize: true },
      });
    });

    return redemption;
  }

  async getUserRedemptions(userId: number) {
    return this.prisma.redemption.findMany({
      where: { userId },
      include: { prize: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRedemptions() {
    return this.prisma.redemption.findMany({
      include: { user: { select: { id: true, username: true } }, prize: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: number, status: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id },
    });
    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return this.prisma.redemption.update({
      where: { id },
      data: { status },
    });
  }
}
