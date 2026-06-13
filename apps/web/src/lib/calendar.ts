export interface CalendarDayStatus {
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  complete: boolean;
}

export interface MonthCell extends Partial<CalendarDayStatus> {
  date: string;
  day: number;
  inMonth: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildMonthCells(month: string, statusByDate: Record<string, CalendarDayStatus>): MonthCell[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayFirstOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth.getTime() - mondayFirstOffset * DAY_MS);
  const lastOfMonth = new Date(Date.UTC(year, monthNumber, 0));
  const daysInMonth = lastOfMonth.getUTCDate();
  const gridSize = Math.ceil((mondayFirstOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: gridSize }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * DAY_MS);
    const value = formatDate(date);
    const status = statusByDate[value] ?? {
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
      complete: false
    };

    return {
      date: value,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthNumber - 1,
      ...status
    };
  });
}
