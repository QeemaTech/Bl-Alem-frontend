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
import DashboardLayout from './DashboardLayout';

export default function AdminLayout() {
  return (
    <DashboardLayout
      title="لوحة المشرف العام"
      sidebarTitle="إدارة المنصة"
      notificationsPath="/admin/notifications"
      items={[
        { label: 'الرئيسية', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'المستخدمون', path: '/admin/users', icon: Users },
        { label: 'الطلاب', path: '/admin/students', icon: GraduationCap },
        { label: 'المحاضرون', path: '/admin/instructors', icon: CoPresent },
        { label: 'التصنيفات', path: '/admin/categories', icon: Tags },
        { label: 'المسارات التعليمية', path: '/admin/learning-paths', icon: FolderTree },
        { label: 'الكورسات', path: '/admin/courses', icon: BookOpen },
        { label: 'البث المباشر', path: '/admin/live', icon: LiveTv },
        { label: 'المدفوعات', path: '/admin/payments', icon: CreditCard },
        { label: 'الكوبونات', path: '/admin/coupons', icon: Ticket },
        { label: 'المكافآت', path: '/admin/rewards', icon: Redeem },
        { label: 'الشهادات', path: '/admin/certificates', icon: Award },
        { label: 'التقييمات', path: '/admin/reviews', icon: Star },
        { label: 'الإشعارات', path: '/admin/notifications', icon: Bell },
        { label: 'الدعم الفني', path: '/admin/support', icon: Headphones },
        { label: 'السحوبات', path: '/admin/withdrawals', icon: AccountBalance },
        { label: 'التقارير', path: '/admin/reports', icon: BarChart3 },
        { label: 'الإعدادات', path: '/admin/settings', icon: Settings },
      ]}
    />
  );
}
