import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  it('lists active tasks filtered by visibility for the requested date', async () => {
    const prisma = {
      task: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: '喝水',
            description: null,
            scope: 'resident',
            scheduledDate: null,
            repeatDays: null,
            startDate: null,
            reminderTime: '21:00',
            sortOrder: 0,
            isActive: true,
            checkins: [{ id: 11, checkedAt: new Date('2026-06-12T10:00:00.000Z'), photoUrl: null, mood: null, note: null }],
            skips: [],
          },
          {
            id: 2,
            title: '买花',
            description: '周五',
            scope: 'dated',
            scheduledDate: '2026-06-12',
            repeatDays: null,
            startDate: null,
            reminderTime: null,
            sortOrder: 1,
            isActive: true,
            checkins: [],
            skips: [],
          }
        ])
      }
    };
    const service = new TasksService(prisma as never);

    const result = await service.list(7, '2026-06-12');

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: { userId: 7, isActive: true },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        checkins: {
          where: { userId: 7, checkinDate: '2026-06-12' },
          select: { id: true, checkedAt: true, photoUrl: true, mood: true, note: true }
        },
        skips: {
          where: { userId: 7, skipDate: '2026-06-12' },
          select: { id: true }
        }
      }
    });
    expect(result).toEqual([
      {
        id: 1,
        title: '喝水',
        description: null,
        scope: 'resident',
        scheduledDate: null,
        repeatDays: null,
        startDate: null,
        reminderTime: '21:00',
        sortOrder: 0,
        checked: true,
        checkedToday: true,
        checkedAt: new Date('2026-06-12T10:00:00.000Z'),
        checkinId: 11,
        photoUrl: null,
        mood: null,
        note: null,
      },
      {
        id: 2,
        title: '买花',
        description: '周五',
        scope: 'dated',
        scheduledDate: '2026-06-12',
        repeatDays: null,
        startDate: null,
        reminderTime: null,
        sortOrder: 1,
        checked: false,
        checkedToday: false,
        checkedAt: null,
        checkinId: null,
        photoUrl: null,
        mood: null,
        note: null,
      }
    ]);
  });

  it('creates dated tasks only when a scheduled date is provided', async () => {
    const prisma = {
      task: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({ id: 3, scope: 'dated', scheduledDate: '2026-06-12' })
      }
    };
    const service = new TasksService(prisma as never);

    await expect(
      service.create(7, {
        title: '买花',
        scope: 'dated',
        scheduledDate: '2026-06-12'
      })
    ).resolves.toEqual({ id: 3, scope: 'dated', scheduledDate: '2026-06-12' });

    await expect(service.create(7, { title: '错误', scope: 'dated' })).rejects.toThrow('日期任务需要选择日期');
  });
});
