import type { MaterialIcon } from '@/icons';
import { Info } from '@/icons';
import { cn } from '@/lib/cn';

interface StatCardProps {
  title: string;
  value: string;
  icon: MaterialIcon;
  trend?: string;
  hint?: string;
  trendUp?: boolean;
  tooltip?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  hint,
  trendUp,
  tooltip,
  className,
}: StatCardProps) {
  const subtitle = hint || trend;

  return (
    <article className={cn('stat-card', className)}>
      <div className="stat-icon" aria-hidden>
        <Icon size={22} />
      </div>
      <div className="stat-card-content">
        <p className="stat-card-title">
          <span className="stat-card-title-text">{title}</span>
          {tooltip ? (
            <span
              className="stat-card-info"
              tabIndex={0}
              role="note"
              aria-label={tooltip}
              title={tooltip}
            >
              <Info size={14} aria-hidden />
            </span>
          ) : null}
        </p>
        <strong className="stat-card-value">{value}</strong>
        {subtitle ? (
          <small className={cn('stat-card-hint', trendUp && 'is-up')}>
            {subtitle}
          </small>
        ) : null}
      </div>
    </article>
  );
}
