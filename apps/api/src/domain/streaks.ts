import { previousDate } from './dates';

export interface StreakInput {
  today: string;
  completedDates: string[];
}

export interface StreakResult {
  current: number;
  best: number;
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
