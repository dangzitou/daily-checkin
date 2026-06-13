import { toUtcDay } from './dates';

const DAY_MS = 24 * 60 * 60 * 1000;

export type GoalStatus = 'active' | 'completed' | 'overdue';

export interface GoalProgressInput {
  startDate: string;
  targetDate: string;
  targetCount: number;
  completedDates: string[];
  today: string;
}

export interface GoalProgressSummary {
  completedCount: number;
  targetCount: number;
  percent: number;
  daysLeft: number;
  totalDays: number;
  status: GoalStatus;
}

export function summarizeGoalProgress(input: GoalProgressInput): GoalProgressSummary {
  const completedCount = new Set(input.completedDates).size;
  const percent = input.targetCount === 0 ? 0 : Math.min(100, Math.round((completedCount / input.targetCount) * 100));
  const daysLeft = Math.max(0, diffDays(input.today, input.targetDate));
  const totalDays = Math.max(1, diffDays(input.startDate, input.targetDate) + 1);
  const status: GoalStatus =
    completedCount >= input.targetCount ? 'completed' : input.today > input.targetDate ? 'overdue' : 'active';

  return {
    completedCount,
    targetCount: input.targetCount,
    percent,
    daysLeft,
    totalDays,
    status
  };
}

function diffDays(start: string, end: string): number {
  return Math.floor((toUtcDay(end) - toUtcDay(start)) / DAY_MS);
}
