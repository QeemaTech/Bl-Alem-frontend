import { useDashboardAnalytics } from '../../../hooks/useDashboardAnalytics';
import { useTranslation } from 'react-i18next';
import { AnalyticsSection } from './AnalyticsSection';
import { ActivityTimeline } from './ActivityTimeline';
import {
  QuickActionsSection,
  RevenueAnalyticsSection,
  UserAnalyticsSection,
} from './DashboardAnalyticsPanels';
import { DashboardHero } from './DashboardHero';
import {
  BusinessInsightsSection,
  OperationsCenter,
} from './DashboardSections';
import { KPIWidget } from './KPIWidget';
import type { AdminDashboardApiData } from './dashboardTypes';
import { useAuth } from '../../../store/AuthContext';
import { useSiteSettings } from '../../../store/SiteSettingsContext';

interface DashboardOverviewProps {
  data: AdminDashboardApiData;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const { platform } = useSiteSettings();
  const analytics = useDashboardAnalytics(data);

  const hasPayments = Boolean(data.latestPayments?.length) || analytics.revenue.total > 0;
  const hasReviews = data.pendingCourses > 0 || Boolean(data.latestCourseRequests?.length);
  const hasTickets = analytics.openSupportTickets > 0 || Boolean(data.latestSupportTickets?.length);

  return (
    <div className="admin-dashboard page-grid">
      <DashboardHero
        userName={user?.fullName}
        platform={platform}
        hero={analytics.hero}
      />

      <AnalyticsSection analytics={analytics} />

      <section className="admin-dash-kpis" aria-label={t('admin.kpisAria')}>
        <header className="admin-dash-section-head is-compact">
          <div>
            <h2>{t('admin.kpisTitle')}</h2>
            <p>{t('admin.kpisSubtitle')}</p>
          </div>
        </header>
        <div className="admin-dash-kpi-grid">
          {analytics.kpis.map((kpi) => (
            <KPIWidget
              key={kpi.id}
              title={kpi.title}
              value={kpi.displayValue}
              trend={kpi.trend}
              trendLabel={kpi.trendLabel}
              sparkline={kpi.sparkline}
              icon={kpi.icon}
              variant={kpi.variant}
            />
          ))}
        </div>
      </section>

      <QuickActionsSection />

      <BusinessInsightsSection items={analytics.insights} />

      <OperationsCenter items={analytics.operations} />

      <div className="admin-dash-split">
        <ActivityTimeline items={analytics.activities} />
        <div className="admin-dash-side-stack">
          <RevenueAnalyticsSection revenue={analytics.revenue} hasPayments={hasPayments} />
          <UserAnalyticsSection users={analytics.users} />
          {!hasReviews && !hasTickets ? (
            <div className="admin-dash-empty-row" aria-live="polite">
              {!hasReviews ? (
                <p className="admin-dash-empty-note">{t('admin.noPendingReviews')}</p>
              ) : null}
              {!hasTickets ? (
                <p className="admin-dash-empty-note">{t('admin.noOpenTickets')}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
