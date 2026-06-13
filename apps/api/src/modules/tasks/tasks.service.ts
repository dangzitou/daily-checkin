import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { todayInShanghai } from '../../domain/dates';
import { validateIsoDate, type TaskScope } from '../../domain/task-visibility';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(userId: number, dateInput?: string) {
    const date = dateInput ? validateIsoDateForRequest(dateInput) : todayInShanghai();
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ scope: 'resident' }, { scope: 'dated', scheduledDate: date }]
      },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        checkins: {
          where: { userId, checkinDate: date },
          select: { id: true, checkedAt: true }
        }
      }
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      scope: task.scope,
      scheduledDate: task.scheduledDate,
      reminderTime: task.reminderTime,
      sortOrder: task.sortOrder,
      checked: task.checkins.length > 0,
      checkedToday: task.checkins.length > 0,
      checkedAt: task.checkins[0]?.checkedAt ?? null
    }));
  }

  async create(
    userId: number,
    input: {
      title: string;
      description?: string;
      scope?: TaskScope;
      scheduledDate?: string | null;
      reminderTime?: string | null;
    }
  ) {
    const scope = input.scope ?? 'resident';
    const scheduledDate = normalizeScheduledDate(scope, input.scheduledDate);
    const nextOrder = await this.prisma.task.count({ where: { userId } });
    return this.prisma.task.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        scope,
        scheduledDate,
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
      reminderTime?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    await this.ensureOwnedTask(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title?.trim(),
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        scope: input.scope,
        scheduledDate:
          input.scope === undefined && input.scheduledDate === undefined
            ? undefined
            : normalizeScheduledDate(input.scope ?? 'resident', input.scheduledDate),
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

  async ensureOwnedTask(userId: number, taskId: number) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, isActive: true }
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
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

function normalizeScheduledDate(scope: TaskScope, scheduledDate?: string | null): string | null {
  if (scope === 'resident') {
    return null;
  }

  if (!scheduledDate) {
    throw new BadRequestException('日期任务需要选择日期');
  }

  return validateIsoDateForRequest(scheduledDate);
}
