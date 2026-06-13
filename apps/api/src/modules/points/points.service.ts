import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const POINTS_PER_CHECKIN = 10;
export const STREAK_BONUS_THRESHOLD = 7;
export const STREAK_BONUS_POINTS = 50;

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
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new Error('Insufficient points');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      }),
      this.prisma.pointLog.create({
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

  async addCheckinPoints(userId: number, streakDays: number): Promise<number> {
    let totalPoints = POINTS_PER_CHECKIN;

    if (streakDays >= STREAK_BONUS_THRESHOLD) {
      totalPoints += STREAK_BONUS_POINTS;
    }

    await this.addPoints(
      userId,
      totalPoints,
      `打卡奖励（连续${streakDays}天）`,
    );

    return totalPoints;
  }
}
