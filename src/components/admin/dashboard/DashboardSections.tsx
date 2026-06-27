import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';
import type { InsightItem, OperationItem } from './dashboardTypes';
import { TrendBadge } from './TrendBadge';

export function BusinessInsightsSection({ items }: { items: InsightItem[] }) {
  const { t } = useTranslation('dashboard');

  return (
    <section className="admin-dash-insights" aria-label={t('admin.dashboard.insights.ariaLabel')}>
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>{t('admin.dashboard.insights.title')}</h2>
          <p>{t('admin.dashboard.insights.subtitle')}</p>
        </div>
      </header>
      <div className="admin-dash-insights-grid">
        {items.map((item) => (
          <Card key={item.id} className="admin-dash-insight-card" variant="stat">
            <p className="admin-dash-insight-title">{item.title}</p>
            <strong className="admin-dash-insight-value">{item.value}</strong>
            <div className="admin-dash-insight-footer">
              <TrendBadge value={item.trend} />
              <small>{item.supporting}</small>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function OperationsCenter({ items }: { items: OperationItem[] }) {
  const { t } = useTranslation('dashboard');
  const { fmtNum } = useDashboardFormatters();

  const priorityLabels = {
    high: t('admin.dashboard.priority.high'),
    medium: t('admin.dashboard.priority.medium'),
    low: t('admin.dashboard.priority.low'),
  } as const;

  const priorityVariant = {
    high: 'danger',
    medium: 'warning',
    low: 'info',
  } as const;

  return (
    <section className="admin-dash-operations" aria-label={t('admin.dashboard.operations.ariaLabel')}>
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>{t('admin.dashboard.operations.title')}</h2>
          <p>{t('admin.dashboard.operations.subtitle')}</p>
        </div>
      </header>
      <div className="admin-dash-operations-grid">
        {items.map((item) => (
          <Link key={item.id} to={item.href} className="admin-dash-operation-card">
            <div className="admin-dash-operation-top">
              <Badge variant={priorityVariant[item.priority]}>
                {priorityLabels[item.priority]}
              </Badge>
              <span
                className="admin-dash-operation-count"
                aria-label={t('admin.dashboard.operations.itemCount', { count: item.count })}
              >
                {fmtNum(item.count)}
              </span>
            </div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <span className="admin-dash-operation-link">
              {t('admin.dashboard.operations.viewDetails')}
              <ArrowLeft size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
