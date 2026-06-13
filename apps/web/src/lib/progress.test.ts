import { describe, expect, it } from 'vitest';
import { summarizeToday } from './progress';

describe('summarizeToday', () => {
  it('summarizes completed tasks and percentage for today', () => {
    const result = summarizeToday([
      { id: 1, title: '喝水', checked: true },
      { id: 2, title: '散步', checked: false },
      { id: 3, title: '阅读', checked: true }
    ]);

    expect(result).toEqual({ total: 3, completed: 2, percent: 67 });
  });

  it('handles an empty task list', () => {
    expect(summarizeToday([])).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});
