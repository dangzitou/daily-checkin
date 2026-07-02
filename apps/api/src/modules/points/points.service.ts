import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { todayInShanghai } from '../../domain/dates';

export const POINTS_PER_CHECKIN = 10;
export const STREAK_BONUS_THRESHOLD = 7;
export const STREAK_BONUS_POINTS = 50;
export const DAILY_POINTS_CAP = 100;

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    return user?.points ?? 0;
  }

  async addPoints(userId: number, amount: number, reason: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
      }),
      this.prisma.pointLog.create({
        data: { userId, amount, reason },
      }),
    ]);
  }

  async deductPoints(userId: number, amount: number, reason: string): Promise<void> {
    // 余额检查和扣减在同一事务中，防止并发导致负余额
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      const balance = user?.points ?? 0;
      if (balance < amount) {
        throw new BadRequestException('积分不足');
      }
      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      });
      await tx.pointLog.create({
        data: { userId, amount: -amount, reason },
      });
    });
  }

  /**
   * 在已有事务中扣除积分，用于需要原子性的多步操作（如兑换）。
   */
  async deductPointsTx(
    tx: Prisma.TransactionClient,
    userId: number,
    amount: number,
    reason: string,
  ): Promise<void> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    const balance = user?.points ?? 0;
    if (balance < amount) {
      throw new BadRequestException('积分不足');
    }

    await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      }),
      tx.pointLog.create({
        data: { userId, amount: -amount, reason },
      }),
    ]);
  }

  async getLogs(userId: number, limit = 20) {
    return this.prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取用户今日已获取的积分总额（使用上海时区）。
   */
  async getTodayEarned(userId: number): Promise<number> {
    const today = todayInShanghai(); // "YYYY-MM-DD"
    const todayStart = new Date(`${today}T00:00:00+08:00`);

    const result = await this.prisma.pointLog.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        amount: { gt: 0 },
        createdAt: { gte: todayStart },
      },
    });

    return result._sum.amount ?? 0;
  }

  async addCheckinPoints(userId: number, streakDays: number): Promise<number> {
    let totalPoints = POINTS_PER_CHECKIN;

    if (streakDays >= STREAK_BONUS_THRESHOLD) {
      totalPoints += STREAK_BONUS_POINTS;
    }

    // Enforce daily points cap
    const todayEarned = await this.getTodayEarned(userId);
    const remaining = DAILY_POINTS_CAP - todayEarned;
    if (remaining <= 0) {
      return 0; // Daily cap reached, no points awarded
    }
    totalPoints = Math.min(totalPoints, remaining);

    await this.addPoints(
      userId,
      totalPoints,
      `打卡奖励（连续${streakDays}天）`,
    );

    return totalPoints;
  }
}
