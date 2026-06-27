import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';
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
  const { t } = useTranslation('dashboard');
  const { fmtDateLong, fmtMoney, fmtNum } = useDashboardFormatters();
  const isHealthy = !platform.maintenanceMode && platform.registrationEnabled;
  const greeting = userName
    ? t('admin.dashboard.hero.greetingNamed', { name: userName })
    : t('admin.dashboard.hero.greetingDefault');
  const openClosed = (enabled: boolean) => (
    enabled ? t('admin.dashboard.hero.open') : t('admin.dashboard.hero.closed')
  );

  return (
    <section className="admin-dash-hero" aria-label={t('admin.dashboard.hero.ariaLabel')}>
      <div className="admin-dash-hero-main">
        <div className="admin-dash-hero-text">
          <Badge variant={isHealthy ? 'success' : 'warning'} dot>
            {isHealthy
              ? t('admin.dashboard.hero.platformHealthy')
              : t('admin.dashboard.hero.needsAttention')}
          </Badge>
          <h1>{greeting}</h1>
          <p>{fmtDateLong(new Date())}</p>
          <div className="admin-dash-hero-status">
            <span className="admin-dash-hero-status-item">
              <span className="admin-dash-hero-status-icon" aria-hidden>
                <Shield size={16} />
              </span>
              {t('admin.dashboard.hero.maintenance', {
                status: platform.maintenanceMode
                  ? t('admin.dashboard.hero.maintenanceOn')
                  : t('admin.dashboard.hero.maintenanceOff'),
              })}
            </span>
            <span className="admin-dash-hero-status-item">
              <span className="admin-dash-hero-status-icon" aria-hidden>
                <GraduationCap size={16} />
              </span>
              {t('admin.dashboard.hero.studentRegistration', {
                status: openClosed(platform.registrationEnabled),
              })}
            </span>
            <span className="admin-dash-hero-status-item">
              <span className="admin-dash-hero-status-icon" aria-hidden>
                <CoPresent size={16} />
              </span>
              {t('admin.dashboard.hero.instructorRegistration', {
                status: openClosed(platform.instructorRegistrationEnabled),
              })}
            </span>
          </div>
        </div>
        <div className="admin-dash-hero-actions">
          <Link to="/admin/courses">
            <Button variant="secondary">{t('admin.dashboard.hero.reviewCourses')}</Button>
          </Link>
          <Link to="/admin/instructors">
            <Button variant="outline">{t('admin.dashboard.hero.instructorRequests')}</Button>
          </Link>
        </div>
      </div>

      <div className="admin-dash-hero-metrics" role="list" aria-label={t('admin.dashboard.hero.metricsAria')}>
        <HeroMetric
          label={t('admin.dashboard.hero.totalRevenue')}
          value={fmtMoney(hero.revenue.value)}
          trend={hero.revenue.trend}
          icon={CreditCard}
        />
        <HeroMetric
          label={t('admin.dashboard.hero.activeStudents')}
          value={fmtNum(hero.students.value)}
          trend={hero.students.trend}
          icon={GraduationCap}
        />
        <HeroMetric
          label={t('admin.dashboard.hero.activeInstructors')}
          value={fmtNum(hero.instructors.value)}
          trend={hero.instructors.trend}
          icon={CoPresent}
        />
        <HeroMetric
          label={t('admin.dashboard.hero.publishedCourses')}
          value={fmtNum(hero.courses.value)}
          trend={hero.courses.trend}
          icon={BookOpen}
        />
      </div>

      {platform.maintenanceMode ? (
        <div className="admin-dash-hero-alert" role="status">
          <CheckCircle2 size={18} aria-hidden />
          <span>{t('admin.dashboard.hero.maintenanceAlert')}</span>
        </div>
      ) : null}
    </section>
  );
}
