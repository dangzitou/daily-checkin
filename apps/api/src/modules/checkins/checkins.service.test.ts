import { describe, expect, it, vi } from 'vitest';
import { CheckinsService } from './checkins.service';

describe('CheckinsService', () => {
  it('summarizes calendar days using tasks visible on each date', async () => {
    const prisma = {
      task: {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, isActive: true, scope: 'resident', scheduledDate: null },
          { id: 2, isActive: true, scope: 'dated', scheduledDate: '2026-06-12' },
          { id: 3, isActive: true, scope: 'dated', scheduledDate: '2026-06-13' }
        ])
      },
      checkin: {
        findMany: vi.fn().mockResolvedValue([
          { checkinDate: '2026-06-12', taskId: 1 },
          { checkinDate: '2026-06-12', taskId: 2 },
          { checkinDate: '2026-06-13', taskId: 1 }
        ])
      }
    };
    const pointsService = {
      addCheckinPoints: vi.fn(),
      deductCheckinPoints: vi.fn(),
    };
    const service = new CheckinsService(prisma as never, {} as never, pointsService as never);

    await expect(service.calendar(7, '2026-06')).resolves.toEqual({
      '2026-06-12': {
        completedTasks: 2,
        totalTasks: 2,
        completionRate: 1,
        complete: true
      },
      '2026-06-13': {
        completedTasks: 1,
        totalTasks: 2,
        completionRate: 0.5,
        complete: false
      }
    });
  });
});
