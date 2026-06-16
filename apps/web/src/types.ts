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

export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😐', label: '一般' },
  { emoji: '😔', label: '难过' },
  { emoji: '😤', label: '烦躁' },
  { emoji: '😴', label: '疲惫' },
] as const;

export type MoodEmoji = (typeof MOOD_OPTIONS)[number]['emoji'];

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
  checkinId: number | null;
  photoUrl: string | null;
  mood: string | null;
  note: string | null;
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

export interface CommentItem {
  id: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

export interface FeedItem {
  id: number;
  userId: number;
  username: string;
  taskId: number;
  taskTitle: string;
  checkinDate: string;
  checkedAt: string;
  photoUrl: string | null;
  mood: string | null;
  note: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: CommentItem[];
}
