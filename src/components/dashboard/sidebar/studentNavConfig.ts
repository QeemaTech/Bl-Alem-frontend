import {
  Award, Bell, BookOpen, CreditCard, Gift, Headphones, LayoutDashboard,
  MessageCircle, PlayCircle, Radio, Route,
} from '@/icons';
import type { SidebarNavSection } from './types';

export const studentNavSections: SidebarNavSection[] = [
  {
    id: 'main',
    labelKey: 'sections.learning',
    items: [
      { labelKey: 'student.dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { labelKey: 'student.courses', path: '/student/courses', icon: BookOpen },
      { labelKey: 'student.learningPaths', path: '/student/learning-paths', icon: Route },
      { labelKey: 'student.myCourses', path: '/student/my-courses', icon: PlayCircle },
      { labelKey: 'student.live', path: '/student/live', icon: Radio, badgeKey: 'live' },
      { labelKey: 'student.community', path: '/student/community', icon: MessageCircle },
    ],
  },
  {
    id: 'account',
    labelKey: 'sections.account',
    items: [
      { labelKey: 'student.certificates', path: '/student/certificates', icon: Award },
      { labelKey: 'student.payments', path: '/student/payments', icon: CreditCard },
      { labelKey: 'student.rewards', path: '/student/rewards', icon: Gift, badgeKey: 'rewards' },
      { labelKey: 'student.notifications', path: '/student/notifications', icon: Bell, badgeKey: 'notifications' },
    ],
  },
  {
    id: 'support',
    labelKey: 'sections.support',
    items: [
      { labelKey: 'student.support', path: '/student/support', icon: Headphones },
    ],
  },
];
