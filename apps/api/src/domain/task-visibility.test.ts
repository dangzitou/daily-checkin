import { describe, expect, it } from 'vitest';
import { isTaskVisibleOnDate, validateIsoDate } from './task-visibility';

describe('task visibility', () => {
  it('shows active resident tasks on any date', () => {
    expect(
      isTaskVisibleOnDate({
        isActive: true,
        scope: 'resident',
        scheduledDate: null,
        date: '2026-06-08'
      })
    ).toBe(true);
  });

  it('shows active dated tasks only on their scheduled date', () => {
    expect(
      isTaskVisibleOnDate({
        isActive: true,
        scope: 'dated',
        scheduledDate: '2026-06-12',
        date: '2026-06-12'
      })
    ).toBe(true);

    expect(
      isTaskVisibleOnDate({
        isActive: true,
        scope: 'dated',
        scheduledDate: '2026-06-12',
        date: '2026-06-13'
      })
    ).toBe(false);
  });

  it('hides inactive tasks', () => {
    expect(
      isTaskVisibleOnDate({
        isActive: false,
        scope: 'resident',
        scheduledDate: null,
        date: '2026-06-08'
      })
    ).toBe(false);
  });

  it('validates real ISO dates', () => {
    expect(validateIsoDate('2026-06-08')).toBe('2026-06-08');
    expect(() => validateIsoDate('2026-6-8')).toThrow('日期格式不正确');
    expect(() => validateIsoDate('2026-02-31')).toThrow('日期格式不正确');
  });
});
