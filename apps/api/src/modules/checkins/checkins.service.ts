import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { monthBounds, todayInShanghai, previousDate } from '../../domain/dates';
import { isTaskVisibleOnDate } from '../../domain/task-visibility';
import { validateIsoDateForRequest } from '../../shared/iso-date';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { PointsService, POINTS_PER_CHECKIN, STREAK_BONUS_THRESHOLD, STREAK_BONUS_POINTS } from '../points/points.service';

@Injectable()
export class CheckinsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TasksService)
    private readonly tasks: TasksService,
    @Inject(PointsService)
    private readonly pointsService: PointsService,
  ) {}

  async checkToday(userId: number, taskId: number) {
    const today = todayInShanghai();
    return this.checkOnDate(userId, taskId, today);
  }

  async checkOnDate(userId: number, taskId: number, dateInput: string) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    await this.ensureVisibleTask(userId, taskId, checkinDate);

    // Check if already checked in
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
    });

    if (existing) {
      return existing; // Already checked in, no points
    }

    // Create checkin
    const checkin = await this.prisma.checkin.create({
      data: { userId, taskId, checkinDate },
    });

    // Calculate streak and add points
    const streakDays = await this.calculateStreak(userId, taskId, checkinDate);
    const pointsEarned = await this.pointsService.addCheckinPoints(userId, streakDays);

    return { ...checkin, pointsEarned };
  }

  async uncheckToday(userId: number, taskId: number) {
    const today = todayInShanghai();
    return this.uncheckOnDate(userId, taskId, today);
  }

  async uncheckOnDate(userId: number, taskId: number, dateInput: string) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    await this.ensureVisibleTask(userId, taskId, checkinDate);

    // Find existing checkin
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
    });

    if (!existing) {
      return { ok: true, pointsDeducted: 0 };
    }

    // Calculate what streak was at checkin time to determine points to deduct
    const streakDays = await this.calculateStreak(userId, taskId, checkinDate);
    let pointsToDeduct = POINTS_PER_CHECKIN;
    if (streakDays >= STREAK_BONUS_THRESHOLD) {
      pointsToDeduct += STREAK_BONUS_POINTS;
    }

    // Deduct points and delete checkin
    await this.pointsService.deductPoints(
      userId,
      pointsToDeduct,
      `取消打卡扣回（连续${streakDays}天）`,
    );

    await this.prisma.checkin.delete({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
    });

    return { ok: true, pointsDeducted: pointsToDeduct };
  }

  async calendar(userId: number, month: string) {
    const bounds = monthBounds(month);
    const tasks = await this.prisma.task.findMany({ where: { userId, isActive: true } });
    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        checkinDate: { gte: bounds.start, lte: bounds.end },
        task: { isActive: true }
      },
      select: { checkinDate: true, taskId: true }
    });

    const byDate = new Map<string, Set<number>>();
    for (const checkin of checkins) {
      const set = byDate.get(checkin.checkinDate) ?? new Set<number>();
      set.add(checkin.taskId);
      byDate.set(checkin.checkinDate, set);
    }

    const dates = new Set<string>(byDate.keys());
    for (const task of tasks) {
      if (task.scope === 'dated' && task.scheduledDate && task.scheduledDate >= bounds.start && task.scheduledDate <= bounds.end) {
        dates.add(task.scheduledDate);
      }
    }

    return Object.fromEntries(
      Array.from(dates)
        .sort()
        .map((date) => {
          const taskIds = byDate.get(date) ?? new Set<number>();
          const completedTasks = taskIds.size;
          const totalTasks = totalForDate(date);
          const completionRate = totalTasks === 0 ? 0 : completedTasks / totalTasks;
          return [
            date,
            {
              completedTasks,
              totalTasks,
              completionRate,
              complete: totalTasks > 0 && completedTasks >= totalTasks
            }
          ];
        })
    );

    function totalForDate(date: string): number {
      return tasks.filter((task) =>
        isTaskVisibleOnDate({
          isActive: task.isActive,
          scope: task.scope as 'resident' | 'dated',
          scheduledDate: task.scheduledDate,
          date
        })
      ).length;
    }
  }

  async completedDates(userId: number, today: string) {
    const tasks = await this.prisma.task.findMany({ where: { userId, isActive: true } });

    const checkins = await this.prisma.checkin.findMany({
      where: { userId, checkinDate: { lte: today }, task: { isActive: true } },
      select: { checkinDate: true, taskId: true }
    });
    const byDate = new Map<string, Set<number>>();

    for (const checkin of checkins) {
      const set = byDate.get(checkin.checkinDate) ?? new Set<number>();
      set.add(checkin.taskId);
      byDate.set(checkin.checkinDate, set);
    }

    return Array.from(byDate.entries())
      .filter(([date, taskIds]) => {
        const totalTasks = tasks.filter((task) =>
          isTaskVisibleOnDate({
            isActive: task.isActive,
            scope: task.scope as 'resident' | 'dated',
            scheduledDate: task.scheduledDate,
            date
          })
        ).length;
        return totalTasks > 0 && taskIds.size >= totalTasks;
      })
      .map(([date]) => date);
  }

  private async calculateStreak(userId: number, taskId: number, currentDate: string): Promise<number> {
    const checkins = await this.prisma.checkin.findMany({
      where: { userId, taskId },
      orderBy: { checkinDate: 'desc' },
      select: { checkinDate: true },
    });

    const dateSet = new Set(checkins.map((c) => c.checkinDate));
    let streak = 0;
    let cursor = currentDate;

    while (dateSet.has(cursor)) {
      streak++;
      cursor = previousDate(cursor);
    }

    return streak;
  }

  private async ensureVisibleTask(userId: number, taskId: number, date: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, isActive: true }
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const visible = isTaskVisibleOnDate({
      isActive: task.isActive,
      scope: task.scope as 'resident' | 'dated',
      scheduledDate: task.scheduledDate,
      date
    });

    if (!visible) {
      throw new NotFoundException('任务不属于该日期');
    }

    return task;
  }
}
