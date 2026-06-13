import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { monthBounds, todayInShanghai } from '../../domain/dates';
import { isTaskVisibleOnDate, validateIsoDate } from '../../domain/task-visibility';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CheckinsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TasksService)
    private readonly tasks: TasksService
  ) {}

  async checkToday(userId: number, taskId: number) {
    const today = todayInShanghai();
    return this.checkOnDate(userId, taskId, today);
  }

  async checkOnDate(userId: number, taskId: number, dateInput: string) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    await this.ensureVisibleTask(userId, taskId, checkinDate);

    return this.prisma.checkin.upsert({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
      create: { userId, taskId, checkinDate },
      update: {}
    });
  }

  async uncheckToday(userId: number, taskId: number) {
    const today = todayInShanghai();
    return this.uncheckOnDate(userId, taskId, today);
  }

  async uncheckOnDate(userId: number, taskId: number, dateInput: string) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    await this.ensureVisibleTask(userId, taskId, checkinDate);
    await this.prisma.checkin.deleteMany({
      where: { userId, taskId, checkinDate }
    });
    return { ok: true };
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

function validateIsoDateForRequest(date: string): string {
  try {
    return validateIsoDate(date);
  } catch {
    throw new BadRequestException('日期格式不正确');
  }
}
