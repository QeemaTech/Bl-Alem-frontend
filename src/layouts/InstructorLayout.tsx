import {
  BarChart3, Bell, BookOpen, Headphones, LayoutDashboard, MessageSquare,
  PlusCircle, Radio, UserRound, Wallet,
} from '@/icons';
import DashboardLayout from './DashboardLayout';

export default function InstructorLayout() {
  return (
    <DashboardLayout
      title="لوحة المحاضر"
      sidebarTitle="إدارة التدريب"
      notificationsPath="/instructor/notifications"
      profilePath="/instructor/profile"
      items={[
        { label: 'الرئيسية', path: '/instructor/dashboard', icon: LayoutDashboard },
        { label: 'كورساتي', path: '/instructor/courses', icon: BookOpen },
        { label: 'إضافة كورس', path: '/instructor/courses/create', icon: PlusCircle },
        { label: 'البث المباشر', path: '/instructor/live', icon: Radio },
        { label: 'الطلاب', path: '/instructor/students', icon: BarChart3 },
        { label: 'التقييمات', path: '/instructor/reviews', icon: MessageSquare },
        { label: 'الأرباح', path: '/instructor/earnings', icon: Wallet },
        { label: 'الإشعارات', path: '/instructor/notifications', icon: Bell },
        { label: 'الدعم', path: '/instructor/support', icon: Headphones },
        { label: 'الملف الشخصي', path: '/instructor/profile', icon: UserRound },
      ]}
    />
  );
}
