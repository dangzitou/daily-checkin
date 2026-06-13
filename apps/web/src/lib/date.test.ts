import { describe, expect, it } from 'vitest';
import { formatLocalDate, formatMonth } from './date';

describe('date formatting', () => {
  it('formats local dates without using UTC slicing', () => {
    const date = new Date(2026, 5, 8, 1, 20, 0);
    expect(formatLocalDate(date)).toBe('2026-06-08');
    expect(formatMonth(date)).toBe('2026-06');
  });
});
