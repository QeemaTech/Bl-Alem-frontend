import { useTranslation } from 'react-i18next';

export function AdminDashboardSkeleton() {
  const { t } = useTranslation('dashboard');

  return (
    <div className="admin-dashboard page-grid" aria-busy="true" aria-label={t('admin.dashboard.skeletonAria')}>
      <div className="skeleton admin-dash-skeleton-hero" />
      <div className="admin-dash-analytics-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton admin-dash-skeleton-chart" />
        ))}
      </div>
      <div className="admin-dash-kpi-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton admin-dash-skeleton-kpi" />
        ))}
      </div>
      <div className="admin-dash-insights-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton admin-dash-skeleton-insight" />
        ))}
      </div>
      <div className="admin-dash-operations-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton admin-dash-skeleton-operation" />
        ))}
      </div>
      <div className="admin-dash-split">
        <div className="skeleton admin-dash-skeleton-timeline" />
        <div className="admin-dash-side-stack">
          <div className="skeleton admin-dash-skeleton-side" />
          <div className="skeleton admin-dash-skeleton-side" />
        </div>
      </div>
      <div className="admin-dash-actions-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton admin-dash-skeleton-action" />
        ))}
      </div>
    </div>
  );
}
