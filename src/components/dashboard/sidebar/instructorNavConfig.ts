import {
  BarChart3, Bell, BookOpen, Headphones, LayoutDashboard, MessageSquare,
  PlusCircle, Radio, Wallet,
} from '@/icons';
import type { SidebarNavSection } from './types';

export const instructorNavSections: SidebarNavSection[] = [
  {
    id: 'main',
    labelKey: 'sections.training',
    items: [
      { labelKey: 'instructor.dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
      { labelKey: 'instructor.courses', path: '/instructor/courses', icon: BookOpen },
      { labelKey: 'instructor.addCourse', path: '/instructor/courses/create', icon: PlusCircle },
      { labelKey: 'instructor.live', path: '/instructor/live', icon: Radio },
      { labelKey: 'instructor.students', path: '/instructor/students', icon: BarChart3 },
      { labelKey: 'instructor.reviews', path: '/instructor/reviews', icon: MessageSquare },
      { labelKey: 'instructor.earnings', path: '/instructor/earnings', icon: Wallet },
    ],
  },
  {
    id: 'account',
    labelKey: 'sections.account',
    items: [
      { labelKey: 'instructor.notifications', path: '/instructor/notifications', icon: Bell, badgeKey: 'notifications' },
      { labelKey: 'instructor.support', path: '/instructor/support', icon: Headphones },
    ],
  },
];
