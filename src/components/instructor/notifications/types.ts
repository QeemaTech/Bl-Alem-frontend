import type { LucideIcon } from '@/icons';
import {
  Bell, BookOpen, CreditCard, Radio, Settings, Star, Wallet,
} from '@/icons';

export interface InstructorNotification {
  id: number;
  titleAr: string;
  titleEn?: string | null;
  bodyAr: string;
  bodyEn?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const IMPORTANT_TYPES = new Set(['WITHDRAWAL', 'LIVE_SESSION', 'PAYMENT', 'EARNING']);

export type NotificationTone = 'live' | 'withdrawal' | 'review' | 'earning' | 'system';

export const TYPE_VISUAL: Record<string, { tone: NotificationTone; icon: LucideIcon }> = {
  LIVE_SESSION: { tone: 'live', icon: Radio },
  WITHDRAWAL: { tone: 'withdrawal', icon: Wallet },
  REVIEW: { tone: 'review', icon: Star },
  PAYMENT: { tone: 'earning', icon: CreditCard },
  EARNING: { tone: 'earning', icon: CreditCard },
  SUBSCRIPTION: { tone: 'earning', icon: CreditCard },
  COURSE: { tone: 'system', icon: BookOpen },
  ADMIN: { tone: 'system', icon: Settings },
  SUPPORT: { tone: 'system', icon: Settings },
};

export const TONE_GRADIENT: Record<NotificationTone, string> = {
  live: 'from-sky-400 to-blue-600 shadow-sky-500/25',
  withdrawal: 'from-orange-400 to-amber-600 shadow-orange-500/25',
  review: 'from-yellow-400 to-amber-500 shadow-amber-500/25',
  earning: 'from-emerald-400 to-green-600 shadow-emerald-500/25',
  system: 'from-violet-400 to-purple-600 shadow-violet-500/25',
};

export const TONE_PILL: Record<NotificationTone, string> = {
  live: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  withdrawal: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  review: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  earning: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  system: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
};

export const pctOfTotal = (part: number, total: number) => (
  total > 0 ? `${Math.round((part / total) * 100)}%` : '0%'
);
