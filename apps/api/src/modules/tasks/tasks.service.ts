import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { todayInShanghai } from '../../domain/dates';
import { type TaskScope, isTaskVisibleOnDate } from '../../domain/task-visibility';
import { validateIsoDateForRequest } from '../../shared/iso-date';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVE_TASKS = 20;

@Injectable()
export class TasksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(userId: number, dateInput?: string) {
    const date = dateInput ? validateIsoDateForRequest(dateInput) : todayInShanghai();

    // 取所有活跃任务
    const tasks = await this.prisma.task.findMany({
      where: { userId, isActive: true },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        checkins: {
          where: { userId, checkinDate: date },
          select: { id: true, checkedAt: true, photoUrl: true, mood: true, note: true }
        },
        skips: {
          where: { userId, skipDate: date },
          select: { id: true }
        }
      }
    });

    // 按可见性过滤
    return tasks
      .filter((task) =>
        isTaskVisibleOnDate({
          isActive: task.isActive,
          scope: task.scope as TaskScope,
          scheduledDate: task.scheduledDate,
          repeatDays: task.repeatDays,
          startDate: task.startDate,
          date
        })
      )
      .filter((task) => task.skips.length === 0) // 排除被跳过的
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        scope: task.scope,
        scheduledDate: task.scheduledDate,
        repeatDays: task.repeatDays,
        startDate: task.startDate,
        reminderTime: task.reminderTime,
        sortOrder: task.sortOrder,
        checked: task.checkins.length > 0,
        checkedToday: task.checkins.length > 0,
        checkedAt: task.checkins[0]?.checkedAt ?? null,
        checkinId: task.checkins[0]?.id ?? null,
        photoUrl: task.checkins[0]?.photoUrl ?? null,
        mood: task.checkins[0]?.mood ?? null,
        note: task.checkins[0]?.note ?? null,
      }));
  }

  async create(
    userId: number,
    input: {
      title: string;
      description?: string;
      scope?: TaskScope;
      scheduledDate?: string | null;
      repeatDays?: number[] | null;
      startDate?: string | null;
      reminderTime?: string | null;
    }
  ) {
    const scope = input.scope ?? 'resident';
    const scheduledDate = normalizeScheduledDate(scope, input.scheduledDate);
    const repeatDays = normalizeRepeatDays(scope, input.repeatDays);

    // Limit active tasks per user to prevent points farming
    const activeCount = await this.prisma.task.count({ where: { userId, isActive: true } });
    if (activeCount >= MAX_ACTIVE_TASKS) {
      throw new BadRequestException(`最多创建 ${MAX_ACTIVE_TASKS} 个活跃任务`);
    }

    const nextOrder = await this.prisma.task.count({ where: { userId } });
    return this.prisma.task.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        scope,
        scheduledDate,
        repeatDays,
        startDate: input.startDate || null,
        reminderTime: input.reminderTime || null,
        sortOrder: nextOrder
      }
    });
  }

  async update(
    userId: number,
    taskId: number,
    input: {
      title?: string;
      description?: string | null;
      scope?: TaskScope;
      scheduledDate?: string | null;
      repeatDays?: number[] | null;
      startDate?: string | null;
      reminderTime?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    await this.ensureOwnedTask(userId, taskId);

    const scope = input.scope;
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title?.trim(),
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        scope,
        scheduledDate:
          scope === undefined && input.scheduledDate === undefined
            ? undefined
            : normalizeScheduledDate(scope ?? 'resident', input.scheduledDate),
        repeatDays:
          scope === undefined && input.repeatDays === undefined
            ? undefined
            : normalizeRepeatDays(scope ?? 'resident', input.repeatDays),
        startDate: input.startDate === undefined ? undefined : input.startDate || null,
        reminderTime: input.reminderTime === undefined ? undefined : input.reminderTime || null,
        isActive: input.isActive,
        sortOrder: input.sortOrder
      }
    });
  }

  async deactivate(userId: number, taskId: number) {
    await this.ensureOwnedTask(userId, taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: { isActive: false }
    });
  }

  /** 跳过某天的任务（不删除任务，只是今天不显示） */
  async skipDate(userId: number, taskId: number, dateInput?: string) {
    const date = dateInput ? validateIsoDateForRequest(dateInput) : todayInShanghai();
    await this.ensureOwnedTask(userId, taskId);

    // 已签到的任务不能跳过
    const existing = await this.prisma.checkin.findUnique({
      where: { userId_taskId_checkinDate: { userId, taskId, checkinDate: date } }
    });
    if (existing) {
      throw new BadRequestException('已签到的任务不能跳过');
    }

    return this.prisma.taskSkip.upsert({
      where: { userId_taskId_skipDate: { userId, taskId, skipDate: date } },
      update: {},
      create: { userId, taskId, skipDate: date }
    });
  }

  /** 取消跳过 */
  async unskipDate(userId: number, taskId: number, dateInput?: string) {
    const date = dateInput ? validateIsoDateForRequest(dateInput) : todayInShanghai();
    await this.prisma.taskSkip.deleteMany({
      where: { userId, taskId, skipDate: date }
    });
    return { ok: true };
  }

  /** 获取某天被跳过的任务 */
  async getSkippedIds(userId: number, date: string) {
    const skips = await this.prisma.taskSkip.findMany({
      where: { userId, skipDate: date },
      select: { taskId: true }
    });
    return skips.map((s) => s.taskId);
  }

  async ensureOwnedTask(userId: number, taskId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (!task.isActive) {
      throw new BadRequestException('任务已停用');
    }

    return task;
  }
}

function normalizeScheduledDate(scope: TaskScope, scheduledDate?: string | null): string | null {
  if (scope === 'resident' || scope === 'weekly' || scope === 'monthly') {
    return null;
  }

  if (!scheduledDate) {
    throw new BadRequestException('日期任务需要选择日期');
  }

  return validateIsoDateForRequest(scheduledDate);
}

/** 规范化 repeatDays：weekly 必须是 [0-6]，monthly 必须是 [1-31] */
function normalizeRepeatDays(scope: TaskScope, repeatDays?: number[] | null): string | null {
  if (scope !== 'weekly' && scope !== 'monthly') {
    return null;
  }

  if (!repeatDays || !Array.isArray(repeatDays) || repeatDays.length === 0) {
    throw new BadRequestException(
      scope === 'weekly' ? '周任务需要选择至少一个星期几' : '月任务需要选择至少一个日期'
    );
  }

  if (scope === 'weekly') {
    const valid = repeatDays.every((d) => d >= 0 && d <= 6);
    if (!valid) throw new BadRequestException('星期几必须在 0-6 之间（0=周日）');
  }

  if (scope === 'monthly') {
    const valid = repeatDays.every((d) => d >= 1 && d <= 31);
    if (!valid) throw new BadRequestException('每月日期必须在 1-31 之间');
  }

  return JSON.stringify([...new Set(repeatDays)].sort((a, b) => a - b));
}
