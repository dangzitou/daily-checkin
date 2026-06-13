export interface User {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  points: number;
}

export interface Prize {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  stock: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PointLog {
  id: number;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Redemption {
  id: number;
  userId: number;
  prizeId: number;
  pointsCost: number;
  status: string;
  createdAt: string;
  prize?: Prize;
  user?: { id: number; username: string };
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
