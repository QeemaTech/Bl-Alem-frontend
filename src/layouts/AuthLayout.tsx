import { BookOpen, GraduationCap, Users } from '@/icons';
import { Outlet } from 'react-router-dom';
import { BrandMark } from '../components/ui/BrandMark';
import { useSiteSettings } from '../store/SiteSettingsContext';

export default function AuthLayout() {
  const { settings } = useSiteSettings();

  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <BrandMark variant="auth" />
        <h1>{settings.platformTagline || 'منصة تعليمية متكاملة'}</h1>
        <p>سجّل الدخول للوصول إلى لوحة الطالب أو المحاضر حسب صلاحياتك.</p>
        <div className="auth-hero-features">
          <div className="auth-hero-feature">
            <GraduationCap size={22} />
            <span>تعلّم بمرونة مع دورات تفاعلية وجلسات مباشرة</span>
          </div>
          <div className="auth-hero-feature">
            <BookOpen size={22} />
            <span>تابع تقدمك واحصل على شهادات معتمدة</span>
          </div>
          <div className="auth-hero-feature">
            <Users size={22} />
            <span>انضم كطالب أو محاضر وابدأ رحلتك التعليمية</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <Outlet />
      </section>
    </main>
  );
}
