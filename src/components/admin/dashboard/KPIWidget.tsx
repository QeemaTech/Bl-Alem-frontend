import type { MaterialIcon } from '@/icons';
import { cn } from '@/lib/cn';
import { Sparkline } from './Sparkline';
import { TrendBadge } from './TrendBadge';

interface KPIWidgetProps {
  title: string;
  value: string;
  trend: number;
  trendLabel?: string;
  sparkline: number[];
  icon: MaterialIcon;
  variant?: 'primary' | 'success' | 'warning';
  className?: string;
}

export function KPIWidget({
  title,
  value,
  trend,
  trendLabel,
  sparkline,
  icon: Icon,
  variant = 'primary',
  className,
}: KPIWidgetProps) {
  return (
    <article
      className={cn('admin-dash-kpi', className)}
      aria-label={`${title}: ${value}`}
    >
      <div className="admin-dash-kpi-top">
        <div className={cn('admin-dash-kpi-icon', `is-${variant}`)} aria-hidden>
          <Icon size={22} />
        </div>
        <TrendBadge value={trend} label={trendLabel} />
      </div>
      <div className="admin-dash-kpi-body">
        <p className="admin-dash-kpi-title">{title}</p>
        <strong className="admin-dash-kpi-value">{value}</strong>
      </div>
      <Sparkline data={sparkline} variant={variant} />
    </article>
  );
}
