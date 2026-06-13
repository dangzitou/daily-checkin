const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function todayInShanghai(now = new Date()): string {
  return new Date(now.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

export function timeInShanghai(now = new Date()): string {
  return new Date(now.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(11, 16);
}

export function monthBounds(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

/** 将 ISO 日期字符串转为 UTC 当天 00:00 的毫秒时间戳 */
export function toUtcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** 将 UTC 毫秒时间戳格式化为 ISO 日期字符串 */
export function formatUtcDay(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

/** 获取指定 ISO 日期的前一天 */
export function previousDate(date: string): string {
  return formatUtcDay(toUtcDay(date) - DAY_MS);
}
