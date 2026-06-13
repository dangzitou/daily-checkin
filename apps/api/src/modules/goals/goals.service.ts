import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { todayInShanghai } from '../../domain/dates';
import { summarizeGoalProgress } from '../../domain/goals';
import { validateIsoDate } from '../../domain/task-visibility';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGoalInput {
  title: string;
  description?: string;
  startDate: string;
  targetDate: string;
  targetCount: number;
}

@Injectable()
export class GoalsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: number, input: CreateGoalInput) {
    const startDate = validateDateForRequest(input.startDate);
    const targetDate = validateDateForRequest(input.targetDate);
    if (targetDate < startDate) {
      throw new BadRequestException('目标日期不能早于开始日期');
    }

    const title = input.title.trim();
    const description = input.description?.trim() || null;
    const sortOrder = await this.prisma.task.count({ where: { userId } });
    const task = await this.prisma.task.create({
      data: {
        userId,
        title,
        description,
        scope: 'resident',
        scheduledDate: null,
        reminderTime: null,
        sortOrder
      },
      select: { id: true }
    });

    return this.prisma.goal.create({
      data: {
        userId,
        taskId: task.id,
        title,
        description,
        startDate,
        targetDate,
        targetCount: input.targetCount
      }
    });
  }

  async deactivate(userId: number, goalId: number) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId, isActive: true }
    });
    if (!goal) {
      throw new NotFoundException('目标不存在');
    }

    // Deactivate both the goal and its associated task
    await this.prisma.$transaction([
      this.prisma.goal.update({
        where: { id: goalId },
        data: { isActive: false }
      }),
      this.prisma.task.update({
        where: { id: goal.taskId },
        data: { isActive: false }
      })
    ]);

    return { success: true };
  }

  async list(userId: number, today = todayInShanghai()) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        task: {
          select: {
            checkins: {
              select: { checkinDate: true }
            }
          }
        }
      }
    });

    return goals.map((goal) => {
      const progress = summarizeGoalProgress({
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        targetCount: goal.targetCount,
        completedDates: goal.task.checkins
          .map((checkin) => checkin.checkinDate)
          .filter((date) => date >= goal.startDate && date <= goal.targetDate),
        today
      });

      return {
        id: goal.id,
        taskId: goal.taskId,
        title: goal.title,
        description: goal.description,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        isActive: goal.isActive,
        checkedToday: goal.task.checkins.some((checkin) => checkin.checkinDate === today),
        ...progress
      };
    });
  }
}

function validateDateForRequest(date: string): string {
  try {
    return validateIsoDate(date);
  } catch {
    throw new BadRequestException('日期格式不正确');
  }
}
