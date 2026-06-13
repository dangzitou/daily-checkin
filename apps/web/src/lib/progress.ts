export interface TodayTaskLike {
  id: number;
  title: string;
  checked?: boolean;
  checkedToday?: boolean;
}

export interface TodaySummary {
  total: number;
  completed: number;
  percent: number;
}

export function summarizeToday(tasks: TodayTaskLike[]): TodaySummary {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.checked ?? task.checkedToday).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, percent };
}
