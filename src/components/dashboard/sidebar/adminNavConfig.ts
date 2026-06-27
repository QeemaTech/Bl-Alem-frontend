import {
  Award,
  Bell,
  BookOpen,
  CreditCard,
  FolderTree,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LiveTv,
  CoPresent,
  Settings,
  Star,
  Tags,
  Ticket,
  Users,
  AccountBalance,
  BarChart3,
  Redeem,
} from '@/icons';
import type { SidebarNavItem } from './types';

export const adminNavItems: SidebarNavItem[] = [
  { labelKey: 'admin.dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { labelKey: 'admin.users', path: '/admin/users', icon: Users },
  { labelKey: 'admin.students', path: '/admin/students', icon: GraduationCap },
  { labelKey: 'admin.instructors', path: '/admin/instructors', icon: CoPresent },
  { labelKey: 'admin.categories', path: '/admin/categories', icon: Tags },
  { labelKey: 'admin.learningPaths', path: '/admin/learning-paths', icon: FolderTree },
  { labelKey: 'admin.courses', path: '/admin/courses', icon: BookOpen },
  { labelKey: 'admin.live', path: '/admin/live', icon: LiveTv },
  { labelKey: 'admin.payments', path: '/admin/payments', icon: CreditCard },
  { labelKey: 'admin.coupons', path: '/admin/coupons', icon: Ticket },
  { labelKey: 'admin.rewards', path: '/admin/rewards', icon: Redeem },
  { labelKey: 'admin.certificates', path: '/admin/certificates', icon: Award },
  { labelKey: 'admin.reviews', path: '/admin/reviews', icon: Star },
  { labelKey: 'admin.notifications', path: '/admin/notifications', icon: Bell },
  { labelKey: 'admin.support', path: '/admin/support', icon: Headphones },
  { labelKey: 'admin.withdrawals', path: '/admin/withdrawals', icon: AccountBalance },
  { labelKey: 'admin.reports', path: '/admin/reports', icon: BarChart3 },
  { labelKey: 'admin.settings', path: '/admin/settings', icon: Settings },
];
