import { useTranslation } from 'react-i18next';
import type { DashboardAnalytics } from './dashboardTypes';
import { DonutChart } from './DonutChart';
import { RevenueChart } from './RevenueChart';
import { UserGrowthChart } from './UserGrowthChart';

interface AnalyticsSectionProps {
  analytics: DashboardAnalytics;
}

export function AnalyticsSection({ analytics }: AnalyticsSectionProps) {
  const { t } = useTranslation('dashboard');

  return (
    <section className="admin-dash-analytics" aria-label={t('admin.dashboard.analytics.ariaLabel')}>
      <div className="admin-dash-section-head">
        <div>
          <h2>{t('admin.dashboard.analytics.title')}</h2>
          <p>{t('admin.dashboard.analytics.subtitle')}</p>
        </div>
      </div>
      <div className="admin-dash-analytics-grid">
        <RevenueChart data={analytics.revenueTrend} growth={analytics.revenueGrowth} />
        <UserGrowthChart data={analytics.userGrowth} />
        <DonutChart
          title={t('admin.dashboard.analytics.courseActivity')}
          subtitle={t('admin.dashboard.analytics.byStatus')}
          data={analytics.courseActivity}
          ariaLabel={t('admin.dashboard.analytics.courseStatusAria')}
        />
        <DonutChart
          title={t('admin.dashboard.analytics.subscriptionDistribution')}
          subtitle={t('admin.dashboard.analytics.byStatus')}
          data={analytics.subscriptionDistribution}
          ariaLabel={t('admin.dashboard.analytics.subscriptionAria')}
        />
      </div>
    </section>
  );
}
