import { describe, expect, it } from 'vitest';
import { calculateStreaks } from './streaks';

describe('calculateStreaks', () => {
  it('counts the current streak ending today and the best historical streak', () => {
    const result = calculateStreaks({
      today: '2026-06-07',
      completedDates: ['2026-06-01', '2026-06-03', '2026-06-04', '2026-06-06', '2026-06-07']
    });

    expect(result).toEqual({ current: 2, best: 2 });
  });

  it('returns a zero current streak when today is incomplete', () => {
    const result = calculateStreaks({
      today: '2026-06-07',
      completedDates: ['2026-06-03', '2026-06-04', '2026-06-05']
    });

    expect(result).toEqual({ current: 0, best: 3 });
  });
});
