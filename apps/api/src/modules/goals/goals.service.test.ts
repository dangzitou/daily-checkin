import { describe, expect, it, vi } from 'vitest';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  it('creates a goal with a resident task bound to it', async () => {
    const prisma = {
      task: {
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn().mockResolvedValue({ id: 10 })
      },
      goal: {
        create: vi.fn().mockResolvedValue({ id: 3, title: '30 天运动' })
      }
    };
    const service = new GoalsService(prisma as never);

    await expect(
      service.create(7, {
        title: '30 天运动',
        description: '每天运动一次',
        startDate: '2026-06-08',
        targetDate: '2026-07-07',
        targetCount: 30
      })
    ).resolves.toEqual({ id: 3, title: '30 天运动' });

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        title: '30 天运动',
        description: '每天运动一次',
        scope: 'resident',
        scheduledDate: null,
        reminderTime: null,
        sortOrder: 2
      },
      select: { id: true }
    });
    expect(prisma.goal.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        taskId: 10,
        title: '30 天运动',
        description: '每天运动一次',
        startDate: '2026-06-08',
        targetDate: '2026-07-07',
        targetCount: 30
      }
    });
  });

  it('lists goals with countdown, today state, and completion progress inside the goal window', async () => {
    const prisma = {
      goal: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            taskId: 9,
            title: '30 天运动',
            description: null,
            startDate: '2026-06-08',
            targetDate: '2026-07-07',
            targetCount: 30,
            isActive: true,
            task: {
              checkins: [
                { checkinDate: '2026-06-07' },
                { checkinDate: '2026-06-08' },
                { checkinDate: '2026-06-09' },
                { checkinDate: '2026-06-09' },
                { checkinDate: '2026-06-18' },
                { checkinDate: '2026-07-08' }
              ]
            }
          }
        ])
      }
    };
    const service = new GoalsService(prisma as never);

    await expect(service.list(7, '2026-06-18')).resolves.toEqual([
      {
        id: 1,
        taskId: 9,
        title: '30 天运动',
        description: null,
        startDate: '2026-06-08',
        targetDate: '2026-07-07',
        targetCount: 30,
        isActive: true,
        checkedToday: true,
        completedCount: 3,
        percent: 10,
        daysLeft: 19,
        totalDays: 30,
        status: 'active'
      }
    ]);

    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { userId: 7, isActive: true },
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
  });
});
