import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  CoPresent,
  CreditCard,
  Gift,
  UsersRound,
} from '@/icons';
import type { MaterialIcon } from '@/icons';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';
import type { DashboardAnalytics } from './dashboardTypes';
import { Sparkline } from './Sparkline';
import { TrendBadge } from './TrendBadge';
import { useChartTheme } from './useChartTheme';

function MiniAreaChart({ data, id }: { data: number[]; id: string }) {
  const theme = useChartTheme();
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="admin-dash-mini-area" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.primary}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RevenueAnalyticsProps {
  revenue: DashboardAnalytics['revenue'];
  hasPayments: boolean;
}

export function RevenueAnalyticsSection({ revenue, hasPayments }: RevenueAnalyticsProps) {
  const { t } = useTranslation('dashboard');
  const { fmtMoney, fmtPct } = useDashboardFormatters();

  if (!hasPayments && revenue.total <= 0) {
    return (
      <Card className="admin-dash-side-card">
        <h3>{t('admin.dashboard.revenue.title')}</h3>
        <EmptyState
          icon={CreditCard}
          title={t('admin.dashboard.revenue.emptyTitle')}
          description={t('admin.dashboard.revenue.emptyDesc')}
        />
      </Card>
    );
  }

  const metrics = [
    {
      id: 'total',
      label: t('admin.dashboard.revenue.total'),
      value: fmtMoney(revenue.total),
      trend: revenue.totalTrend,
      sparkline: revenue.monthlySparkline,
    },
    {
      id: 'monthly',
      label: t('admin.dashboard.revenue.monthly'),
      value: fmtMoney(revenue.monthly),
      trend: revenue.monthlyTrend,
      sparkline: revenue.monthlySparkline,
    },
    {
      id: 'expected',
      label: t('admin.dashboard.revenue.expected'),
      value: fmtMoney(revenue.expected),
      trend: revenue.expectedTrend,
      sparkline: revenue.expectedSparkline,
    },
    {
      id: 'refund',
      label: t('admin.dashboard.revenue.refundRate'),
      value: fmtPct(revenue.refundRate, false),
      trend: revenue.refundTrend,
      sparkline: revenue.monthlySparkline.map((v) => Math.round(v * 0.02)),
    },
  ];

  return (
    <Card className="admin-dash-side-card" aria-label={t('admin.dashboard.revenue.ariaLabel')}>
      <h3>{t('admin.dashboard.revenue.title')}</h3>
      <div className="admin-dash-side-metrics">
        {metrics.map((metric) => (
          <div key={metric.id} className="admin-dash-side-metric">
            <div className="admin-dash-side-metric-head">
              <span>{metric.label}</span>
              <TrendBadge value={metric.trend} />
            </div>
            <strong>{metric.value}</strong>
            <Sparkline data={metric.sparkline} />
          </div>
        ))}
      </div>
    </Card>
  );
}

interface UserAnalyticsProps {
  users: DashboardAnalytics['users'];
}

export function UserAnalyticsSection({ users }: UserAnalyticsProps) {
  const { t } = useTranslation('dashboard');
  const { fmtNum } = useDashboardFormatters();

  const rows = [
    {
      id: 'dau',
      label: t('admin.dashboard.users.dau'),
      value: users.dau,
      trend: users.dauTrend,
      data: users.dauSparkline,
    },
    {
      id: 'wau',
      label: t('admin.dashboard.users.wau'),
      value: users.wau,
      trend: users.wauTrend,
      data: users.wauSparkline,
    },
    {
      id: 'mau',
      label: t('admin.dashboard.users.mau'),
      value: users.mau,
      trend: users.mauTrend,
      data: users.mauSparkline,
    },
  ];

  return (
    <Card className="admin-dash-side-card" aria-label={t('admin.dashboard.users.ariaLabel')}>
      <h3>{t('admin.dashboard.users.title')}</h3>
      <div className="admin-dash-user-metrics">
        {rows.map((row) => (
          <div key={row.id} className="admin-dash-user-metric">
            <div>
              <span>{row.label}</span>
              <strong>{fmtNum(row.value)}</strong>
              <TrendBadge value={row.trend} />
            </div>
            <MiniAreaChart data={row.data} id={`user-area-${row.id}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function QuickActionsSection() {
  const { t } = useTranslation('dashboard');

  const quickActions: { label: string; description: string; href: string; icon: MaterialIcon }[] = [
    {
      label: t('admin.dashboard.quickActions.addCourse'),
      description: t('admin.dashboard.quickActions.addCourseDesc'),
      href: '/admin/courses',
      icon: BookOpen,
    },
    {
      label: t('admin.dashboard.quickActions.approveInstructor'),
      description: t('admin.dashboard.quickActions.approveInstructorDesc'),
      href: '/admin/instructors',
      icon: CoPresent,
    },
    {
      label: t('admin.dashboard.quickActions.createCoupon'),
      description: t('admin.dashboard.quickActions.createCouponDesc'),
      href: '/admin/coupons',
      icon: Gift,
    },
    {
      label: t('admin.dashboard.quickActions.viewReports'),
      description: t('admin.dashboard.quickActions.viewReportsDesc'),
      href: '/admin/reports',
      icon: BarChart3,
    },
    {
      label: t('admin.dashboard.quickActions.manageUsers'),
      description: t('admin.dashboard.quickActions.manageUsersDesc'),
      href: '/admin/users',
      icon: UsersRound,
    },
  ];

  return (
    <section className="admin-dash-actions" aria-label={t('admin.dashboard.quickActions.ariaLabel')}>
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>{t('admin.dashboard.quickActions.title')}</h2>
          <p>{t('admin.dashboard.quickActions.subtitle')}</p>
        </div>
      </header>
      <div className="admin-dash-actions-grid">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} to={action.href} className="admin-dash-action-card">
              <div className="admin-dash-action-icon" aria-hidden>
                <Icon size={22} />
              </div>
              <div>
                <strong>{action.label}</strong>
                <p>{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
