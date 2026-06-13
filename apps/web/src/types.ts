export interface User {
  id: number;
  username: string;
  email: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  scope: 'resident' | 'dated';
  scheduledDate: string | null;
  reminderTime: string | null;
  sortOrder: number;
  checked: boolean;
  checkedToday: boolean;
  checkedAt: string | null;
}

export interface StatsSummary {
  today: string;
  currentStreak: number;
  bestStreak: number;
}

export interface CalendarStatus {
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  complete: boolean;
}

export interface Goal {
  id: number;
  taskId: number;
  title: string;
  description: string | null;
  startDate: string;
  targetDate: string;
  targetCount: number;
  isActive: boolean;
  checkedToday: boolean;
  completedCount: number;
  percent: number;
  daysLeft: number;
  totalDays: number;
  status: 'active' | 'completed' | 'overdue';
}
