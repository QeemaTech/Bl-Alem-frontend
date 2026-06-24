import {
  Award, Bell, BookOpen, CreditCard, Gift, Headphones, LayoutDashboard,
  Radio, Route, Settings, Star, Ticket, UsersRound, Wallet, BarChart3, Tags,
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
        { label: 'المستخدمون', path: '/admin/users', icon: UsersRound },
        { label: 'الطلاب', path: '/admin/students', icon: UsersRound },
        { label: 'المحاضرون', path: '/admin/instructors', icon: UsersRound },
        { label: 'التصنيفات', path: '/admin/categories', icon: Tags },
        { label: 'المسارات التعليمية', path: '/admin/learning-paths', icon: Route },
        { label: 'الكورسات', path: '/admin/courses', icon: BookOpen },
        { label: 'البث المباشر', path: '/admin/live', icon: Radio },
        { label: 'المدفوعات', path: '/admin/payments', icon: CreditCard },
        { label: 'الكوبونات', path: '/admin/coupons', icon: Gift },
        { label: 'المكافآت', path: '/admin/rewards', icon: Gift },
        { label: 'الشهادات', path: '/admin/certificates', icon: Award },
        { label: 'التقييمات', path: '/admin/reviews', icon: Star },
        { label: 'الإشعارات', path: '/admin/notifications', icon: Bell },
        { label: 'الدعم الفني', path: '/admin/support', icon: Headphones },
        { label: 'السحوبات', path: '/admin/withdrawals', icon: Wallet },
        { label: 'التقارير', path: '/admin/reports', icon: BarChart3 },
        { label: 'الإعدادات', path: '/admin/settings', icon: Settings },
      ]}
    />
  );
}
