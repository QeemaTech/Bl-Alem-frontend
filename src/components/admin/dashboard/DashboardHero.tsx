import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  CoPresent,
  CreditCard,
  GraduationCap,
  Shield,
} from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { fmtDateAr, fmtMoney, fmtNum } from './dashboardFormat';
import type { DashboardAnalytics } from './dashboardTypes';
import { TrendBadge } from './TrendBadge';
import type { PlatformSettings } from '../../../utils/platformSettings';

interface DashboardHeroProps {
  userName?: string;
  platform: PlatformSettings;
  hero: DashboardAnalytics['hero'];
}

function HeroMetric({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: number;
  icon: typeof CreditCard;
}) {
  return (
    <div className="admin-dash-hero-metric" aria-label={`${label}: ${value}`}>
      <div className="admin-dash-hero-metric-icon" aria-hidden>
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <TrendBadge value={trend} />
      </div>
    </div>
  );
}

export function DashboardHero({ userName, platform, hero }: DashboardHeroProps) {
  const isHealthy = !platform.maintenanceMode && platform.registrationEnabled;
  const greeting = userName ? `مرحباً، ${userName}` : 'مرحباً بك';

  return (
    <section className="admin-dash-hero" aria-label="نظرة عامة على لوحة التحكم">
      <div className="admin-dash-hero-main">
        <div className="admin-dash-hero-text">
          <Badge variant={isHealthy ? 'success' : 'warning'} dot>
            {isHealthy ? 'المنصة تعمل بشكل طبيعي' : 'يتطلب انتباهك'}
          </Badge>
          <h1>{greeting}</h1>
          <p>{fmtDateAr(new Date())}</p>
          <div className="admin-dash-hero-status">
            <span>
              <Shield size={16} aria-hidden />
              الصيانة: {platform.maintenanceMode ? 'مفعّلة' : 'غير مفعّلة'}
            </span>
            <span>
              <GraduationCap size={16} aria-hidden />
              تسجيل الطلاب: {platform.registrationEnabled ? 'مفتوح' : 'مغلق'}
            </span>
            <span>
              <CoPresent size={16} aria-hidden />
              تسجيل المحاضرين: {platform.instructorRegistrationEnabled ? 'مفتوح' : 'مغلق'}
            </span>
          </div>
        </div>
        <div className="admin-dash-hero-actions">
          <Link to="/admin/courses">
            <Button variant="secondary">مراجعة الكورسات</Button>
          </Link>
          <Link to="/admin/instructors">
            <Button variant="outline">طلبات المحاضرين</Button>
          </Link>
        </div>
      </div>

      <div className="admin-dash-hero-metrics" role="list" aria-label="ملخص سريع">
        <HeroMetric
          label="إجمالي الإيرادات"
          value={fmtMoney(hero.revenue.value)}
          trend={hero.revenue.trend}
          icon={CreditCard}
        />
        <HeroMetric
          label="الطلاب النشطون"
          value={fmtNum(hero.students.value)}
          trend={hero.students.trend}
          icon={GraduationCap}
        />
        <HeroMetric
          label="المحاضرون النشطون"
          value={fmtNum(hero.instructors.value)}
          trend={hero.instructors.trend}
          icon={CoPresent}
        />
        <HeroMetric
          label="الكورسات المنشورة"
          value={fmtNum(hero.courses.value)}
          trend={hero.courses.trend}
          icon={BookOpen}
        />
      </div>

      {platform.maintenanceMode ? (
        <div className="admin-dash-hero-alert" role="status">
          <CheckCircle2 size={18} aria-hidden />
          <span>وضع الصيانة مفعّل — قد يكون الوصول محدوداً للزوار.</span>
        </div>
      ) : null}
    </section>
  );
}
