const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

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
