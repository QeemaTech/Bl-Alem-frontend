import type { LucideIcon } from '@/icons';
import {
  Bell, BookOpen, CreditCard, Radio, Settings, Star, Wallet,
} from '@/icons';

export interface InstructorNotification {
  id: number;
  titleAr: string;
  bodyAr: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  WELCOME: 'ترحيب',
  LIVE_SESSION: 'جلسة مباشرة',
  CERTIFICATE: 'شهادة',
  REWARD: 'مكافأة',
  PAYMENT: 'دفع',
  COMMUNITY: 'مجتمع',
  SUBSCRIPTION: 'اشتراك',
  EARNING: 'أرباح',
  REVIEW: 'تقييم',
  WITHDRAWAL: 'سحب',
  COURSE: 'كورس',
  INSTRUCTOR_REQUEST: 'طلب محاضر',
  COURSE_REVIEW: 'مراجعة كورس',
  SUPPORT: 'دعم فني',
  ADMIN: 'إداري',
};

export const IMPORTANT_TYPES = new Set(['WITHDRAWAL', 'LIVE_SESSION', 'PAYMENT', 'EARNING']);

export const TYPE_VISUAL: Record<string, { tone: string; icon: LucideIcon }> = {
  LIVE_SESSION: { tone: 'live', icon: Radio },
  WITHDRAWAL: { tone: 'withdrawal', icon: Wallet },
  REVIEW: { tone: 'review', icon: Star },
  PAYMENT: { tone: 'sale', icon: CreditCard },
  EARNING: { tone: 'sale', icon: CreditCard },
  SUBSCRIPTION: { tone: 'sale', icon: CreditCard },
  COURSE: { tone: 'system', icon: BookOpen },
  ADMIN: { tone: 'system', icon: Settings },
  SUPPORT: { tone: 'system', icon: Settings },
};

export const fmtRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const pctOfTotal = (part: number, total: number) => (
  total > 0 ? `${Math.round((part / total) * 100)}%` : '0%'
);
