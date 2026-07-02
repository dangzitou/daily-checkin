import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { monthBounds, todayInShanghai, previousDate } from '../../domain/dates';
import { isTaskVisibleOnDate } from '../../domain/task-visibility';
import { validateIsoDateForRequest } from '../../shared/iso-date';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { PointsService, POINTS_PER_CHECKIN, STREAK_BONUS_THRESHOLD, STREAK_BONUS_POINTS } from '../points/points.service';
import { UploadService } from '../upload/upload.service';

export interface CheckinOptions {
  photoPath?: string;
  mood?: string;
  note?: string;
}

@Injectable()
export class CheckinsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(TasksService)
    private readonly tasks: TasksService,
    @Inject(PointsService)
    private readonly pointsService: PointsService,
    @Inject(UploadService)
    private readonly uploadService: UploadService,
  ) {}

  async checkToday(userId: number, taskId: number, options?: CheckinOptions) {
    const today = todayInShanghai();
    return this.checkOnDate(userId, taskId, today, options);
  }

  async checkOnDate(userId: number, taskId: number, dateInput: string, options?: CheckinOptions) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    const task = await this.ensureVisibleTask(userId, taskId, checkinDate);

    // 禁止签到未来日期
    const today = todayInShanghai();
    if (checkinDate > today) {
      throw new NotFoundException('不能签到未来的日期');
    }

    // 利用唯一约束原子性地防止重复签到（竞态安全）
    try {
      const checkin = await this.prisma.checkin.create({
        data: {
          userId,
          taskId,
          checkinDate,
          photoUrl: options?.photoPath,
          mood: options?.mood,
          note: options?.note,
        },
      });

      // Only award points for today's checkin (prevent backdate farming)
      if (checkinDate !== today) {
        return { ...checkin, pointsEarned: 0 };
      }

      // Calculate streak and add points (streak only applies to resident tasks)
      const streakDays = task.scope === 'resident'
        ? await this.calculateStreak(userId, taskId, checkinDate)
        : 1;
      const pointsEarned = await this.pointsService.addCheckinPoints(userId, streakDays);

      return { ...checkin, pointsEarned };
    } catch (e: any) {
      // P2002 = 唯一约束冲突 = 已经签到过了
      if (e?.code === 'P2002') {
        const existing = await this.prisma.checkin.findUnique({
          where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
        });
        return { ...existing!, pointsEarned: 0 };
      }
      throw e;
    }
  }

  async updateCheckin(userId: number, checkinId: number, data: { mood?: string; note?: string; photoUrl?: string }) {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id: checkinId, userId },
    });

    if (!checkin) {
      throw new NotFoundException('打卡记录不存在');
    }

    return this.prisma.checkin.update({
      where: { id: checkinId },
      data,
    });
  }

  async deletePhoto(userId: number, checkinId: number) {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id: checkinId, userId },
    });

    if (!checkin) {
      throw new NotFoundException('打卡记录不存在');
    }

    if (checkin.photoUrl) {
      const filename = this.uploadService.extractFilenameFromUrl(checkin.photoUrl);
      if (filename) {
        this.uploadService.deletePhoto(filename);
      }
    }

    return this.prisma.checkin.update({
      where: { id: checkinId },
      data: { photoUrl: null },
    });
  }

  async uncheckToday(userId: number, taskId: number) {
    const today = todayInShanghai();
    return this.uncheckOnDate(userId, taskId, today);
  }

  async uncheckOnDate(userId: number, taskId: number, dateInput: string) {
    const checkinDate = validateIsoDateForRequest(dateInput);
    const task = await this.ensureVisibleTask(userId, taskId, checkinDate);

    // Find existing checkin
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate } },
    });

    if (!existing) {
      return { ok: true, pointsDeducted: 0 };
    }

    // Only deduct points for today's uncheck (points were only awarded for today)
    const today = todayInShanghai();
    let pointsToDeduct = 0;
    if (checkinDate === today) {
      // streak 仅限 resident 任务
      const streakDays = task.scope === 'resident'
        ? await this.calculateStreak(userId, taskId, checkinDate)
        : 1;
      pointsToDeduct = POINTS_PER_CHECKIN;
      if (streakDays >= STREAK_BONUS_THRESHOLD) {
        pointsToDeduct += STREAK_BONUS_POINTS;
      }

      await this.pointsService.deductPoints(
        userId,
        pointsToDeduct,
        `取消打卡扣回（连续${streakDays}天）`,
      );
    }

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
