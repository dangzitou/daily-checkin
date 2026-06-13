export interface StreakInput {
  today: string;
  completedDates: string[];
}

export interface StreakResult {
  current: number;
  best: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatUtcDay(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function previousDate(date: string): string {
  return formatUtcDay(toUtcDay(date) - DAY_MS);
}

export function calculateStreaks(input: StreakInput): StreakResult {
  const completed = [...new Set(input.completedDates)].sort();
  const completedSet = new Set(completed);

  let current = 0;
  let cursor = input.today;
  while (completedSet.has(cursor)) {
    current += 1;
    cursor = previousDate(cursor);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of completed) {
    if (previous && previousDate(date) === previous) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = date;
  }

  return { current, best };
}
