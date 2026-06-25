import type { DashboardAnalytics } from './dashboardTypes';
import { DonutChart } from './DonutChart';
import { RevenueChart } from './RevenueChart';
import { UserGrowthChart } from './UserGrowthChart';

interface AnalyticsSectionProps {
  analytics: DashboardAnalytics;
}

export function AnalyticsSection({ analytics }: AnalyticsSectionProps) {
  return (
    <section className="admin-dash-analytics" aria-label="تحليلات المنصة">
      <div className="admin-dash-section-head">
        <div>
          <h2>التحليلات</h2>
          <p>نظرة شاملة على الأداء خلال آخر 12 شهراً</p>
        </div>
      </div>
      <div className="admin-dash-analytics-grid">
        <RevenueChart data={analytics.revenueTrend} growth={analytics.revenueGrowth} />
        <UserGrowthChart data={analytics.userGrowth} />
        <DonutChart
          title="نشاط الكورسات"
          subtitle="حسب الحالة"
          data={analytics.courseActivity}
          ariaLabel="توزيع حالات الكورسات"
        />
        <DonutChart
          title="توزيع الاشتراكات"
          subtitle="حسب الحالة"
          data={analytics.subscriptionDistribution}
          ariaLabel="توزيع الاشتراكات"
        />
      </div>
    </section>
  );
}
