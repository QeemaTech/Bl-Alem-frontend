import { TrendingDown, TrendingUp } from '@/icons';
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';

interface TrendBadgeProps {
  value: number;
  label?: string;
}

export function TrendBadge({ value, label }: TrendBadgeProps) {
  const { fmtPct } = useDashboardFormatters();
  const up = value >= 0;
  return (
    <span className={`dash-trend ${up ? 'is-up' : 'is-down'}`}>
      {up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
      <span>{fmtPct(value)}</span>
      {label ? <small>{label}</small> : null}
    </span>
  );
}
