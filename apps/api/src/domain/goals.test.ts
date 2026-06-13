import { describe, expect, it } from 'vitest';
import { summarizeGoalProgress } from './goals';

describe('summarizeGoalProgress', () => {
  it('calculates completed count, percent, and countdown days', () => {
    const result = summarizeGoalProgress({
      startDate: '2026-06-08',
      targetDate: '2026-07-07',
      targetCount: 30,
      completedDates: ['2026-06-08', '2026-06-09', '2026-06-09', '2026-06-10'],
      today: '2026-06-18'
    });

    expect(result).toEqual({
      completedCount: 3,
      targetCount: 30,
      percent: 10,
      daysLeft: 19,
      totalDays: 30,
      status: 'active'
    });
  });

  it('marks complete when target count is reached', () => {
    const result = summarizeGoalProgress({
      startDate: '2026-06-08',
      targetDate: '2026-06-10',
      targetCount: 2,
      completedDates: ['2026-06-08', '2026-06-09'],
      today: '2026-06-09'
    });

    expect(result.status).toBe('completed');
    expect(result.percent).toBe(100);
  });

  it('marks overdue after the target date when incomplete', () => {
    const result = summarizeGoalProgress({
      startDate: '2026-06-01',
      targetDate: '2026-06-03',
      targetCount: 3,
      completedDates: ['2026-06-01'],
      today: '2026-06-08'
    });

    expect(result.status).toBe('overdue');
    expect(result.daysLeft).toBe(0);
  });
});
