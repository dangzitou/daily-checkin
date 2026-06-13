import { describe, expect, it } from 'vitest';
import { buildMonthCells } from './calendar';

describe('buildMonthCells', () => {
  it('builds a Monday-first calendar grid with month completion data', () => {
    const cells = buildMonthCells('2026-06', {
      '2026-06-01': { completedTasks: 2, totalTasks: 2, completionRate: 1, complete: true },
      '2026-06-02': { completedTasks: 1, totalTasks: 2, completionRate: 0.5, complete: false }
    });

    expect(cells).toHaveLength(35);
    expect(cells[0]).toMatchObject({ date: '2026-06-01', inMonth: true, complete: true });
    expect(cells[1]).toMatchObject({ date: '2026-06-02', inMonth: true, completionRate: 0.5 });
    expect(cells[34]).toMatchObject({ date: '2026-07-05', inMonth: false });
  });
});
