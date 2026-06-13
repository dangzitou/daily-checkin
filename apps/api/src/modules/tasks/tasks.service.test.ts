import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  it('lists active resident tasks and dated tasks for the requested date with that date checkin state', async () => {
    const prisma = {
      task: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: '喝水',
            description: null,
            scope: 'resident',
            scheduledDate: null,
            reminderTime: '21:00',
            sortOrder: 0,
            checkins: [{ id: 11, checkedAt: new Date('2026-06-12T10:00:00.000Z') }]
          },
          {
            id: 2,
            title: '买花',
            description: '周五',
            scope: 'dated',
            scheduledDate: '2026-06-12',
            reminderTime: null,
            sortOrder: 1,
            checkins: []
          }
        ])
      }
    };
    const service = new TasksService(prisma as never);

    const result = await service.list(7, '2026-06-12');

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        isActive: true,
        OR: [{ scope: 'resident' }, { scope: 'dated', scheduledDate: '2026-06-12' }]
      },
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        checkins: {
          where: { userId: 7, checkinDate: '2026-06-12' },
          select: { id: true, checkedAt: true }
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
        reminderTime: '21:00',
        sortOrder: 0,
        checked: true,
        checkedToday: true,
        checkedAt: new Date('2026-06-12T10:00:00.000Z')
      },
      {
        id: 2,
        title: '买花',
        description: '周五',
        scope: 'dated',
        scheduledDate: '2026-06-12',
        reminderTime: null,
        sortOrder: 1,
        checked: false,
        checkedToday: false,
        checkedAt: null
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
