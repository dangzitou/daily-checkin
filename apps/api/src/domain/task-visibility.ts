export type TaskScope = 'resident' | 'dated' | 'weekly' | 'monthly';

export interface VisibleTaskInput {
  isActive: boolean;
  scope: TaskScope;
  scheduledDate: string | null;
  repeatDays?: string | null; // JSON array, e.g. "[1,3,5]" for Mon,Wed,Fri or "[1,15]" for 1st,15th
  startDate?: string | null;
  date: string; // "YYYY-MM-DD"
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

/**
 * 判断任务在指定日期是否可见。
 * - resident: 每天可见（受 startDate 约束）
 * - dated: 仅 scheduledDate 当天可见
 * - weekly: 在 repeatDays 指定的星期几可见（受 startDate 约束）
 * - monthly: 在 repeatDays 指定的每月几号可见（受 startDate 约束）
 */
export function isTaskVisibleOnDate(input: VisibleTaskInput): boolean {
  if (!input.isActive) {
    return false;
  }

  // startDate 约束：任务在开始日期之前不可见
  if (input.startDate && input.date < input.startDate) {
    return false;
  }

  switch (input.scope) {
    case 'resident':
      return true;

    case 'dated':
      return input.scheduledDate === input.date;

    case 'weekly':
      return isWeeklyVisible(input.repeatDays, input.date);

    case 'monthly':
      return isMonthlyVisible(input.repeatDays, input.date);

    default:
      return false;
  }
}

/** 解析 repeatDays JSON 数组，失败返回空数组 */
function parseRepeatDays(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

/** 周任务：检查当天星期几是否在 repeatDays 中（0=周日, 1=周一, ..., 6=周六） */
function isWeeklyVisible(repeatDaysRaw: string | null | undefined, dateStr: string): boolean {
  const days = parseRepeatDays(repeatDaysRaw);
  if (days.length === 0) return false;
  // JavaScript Date: 0=Sun, 1=Mon, ..., 6=Sat — 和我们约定一致
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return days.includes(dow);
}

/** 月任务：检查当天是每月几号是否在 repeatDays 中 */
function isMonthlyVisible(repeatDaysRaw: string | null | undefined, dateStr: string): boolean {
  const days = parseRepeatDays(repeatDaysRaw);
  if (days.length === 0) return false;
  const dayOfMonth = Number(dateStr.split('-')[2]);
  return days.includes(dayOfMonth);
}
