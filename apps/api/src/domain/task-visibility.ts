export type TaskScope = 'resident' | 'dated';

export interface VisibleTaskInput {
  isActive: boolean;
  scope: TaskScope;
  scheduledDate: string | null;
  date: string;
}

export function validateIsoDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('日期格式不正确');
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const normalized = parsed.toISOString().slice(0, 10);
  if (normalized !== date) {
    throw new Error('日期格式不正确');
  }

  return date;
}

export function isTaskVisibleOnDate(input: VisibleTaskInput): boolean {
  if (!input.isActive) {
    return false;
  }

  if (input.scope === 'resident') {
    return true;
  }

  return input.scheduledDate === input.date;
}
