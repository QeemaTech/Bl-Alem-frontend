import { Link } from 'react-router-dom';
import { ArrowLeft } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { fmtNum } from './dashboardFormat';
import type { InsightItem, OperationItem } from './dashboardTypes';
import { TrendBadge } from './TrendBadge';

const PRIORITY_LABELS = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
} as const;

const PRIORITY_VARIANT = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
} as const;

export function BusinessInsightsSection({ items }: { items: InsightItem[] }) {
  return (
    <section className="admin-dash-insights" aria-label="رؤى الأعمال">
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>رؤى الأعمال</h2>
          <p>مؤشرات الأداء الرئيسية للمنصة</p>
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
  return (
    <section className="admin-dash-operations" aria-label="مركز العمليات">
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>مركز العمليات</h2>
          <p>مهام تحتاج متابعة فورية</p>
        </div>
      </header>
      <div className="admin-dash-operations-grid">
        {items.map((item) => (
          <Link key={item.id} to={item.href} className="admin-dash-operation-card">
            <div className="admin-dash-operation-top">
              <Badge variant={PRIORITY_VARIANT[item.priority]}>
                {PRIORITY_LABELS[item.priority]}
              </Badge>
              <span className="admin-dash-operation-count" aria-label={`${item.count} عنصر`}>
                {fmtNum(item.count)}
              </span>
            </div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <span className="admin-dash-operation-link">
              عرض التفاصيل
              <ArrowLeft size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
