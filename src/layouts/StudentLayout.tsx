import {
  Award, Bell, BookOpen, CreditCard, Crown, Gift, Headphones, LayoutDashboard,
  MessageCircle, PlayCircle, Radio, Route, UserRound, Wallet,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';

export default function StudentLayout() {
  return (
    <DashboardLayout
      title="لوحة الطالب"
      sidebarTitle="مساحة التعلم"
      notificationsPath="/student/notifications"
      profilePath="/student/profile"
      items={[
        { label: 'الرئيسية', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'الكورسات المتاحة', path: '/student/courses', icon: BookOpen },
        { label: 'المسارات التعليمية', path: '/student/learning-paths', icon: Route },
        { label: 'كورساتي', path: '/student/my-courses', icon: PlayCircle },
        { label: 'البث المباشر', path: '/student/live', icon: Radio },
        { label: 'المجتمع', path: '/student/community', icon: MessageCircle },
        { label: 'خطط الاشتراك', path: '/student/pricing', icon: Crown },
        { label: 'الشهادات', path: '/student/certificates', icon: Award },
        { label: 'المدفوعات', path: '/student/payments', icon: CreditCard },
        { label: 'المحفظة', path: '/student/wallet', icon: Wallet },
        { label: 'المكافآت', path: '/student/rewards', icon: Gift },
        { label: 'الإشعارات', path: '/student/notifications', icon: Bell },
        { label: 'الدعم', path: '/student/support', icon: Headphones },
        { label: 'الملف الشخصي', path: '/student/profile', icon: UserRound },
      ]}
    />
  );
}
