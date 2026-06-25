import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  total?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  total,
  className,
  children,
  ariaLabel,
}: ChartCardProps) {
  return (
    <article
      className={cn('admin-dash-chart-card', className)}
      aria-label={ariaLabel || title}
    >
      <header className="admin-dash-chart-head">
        <div className="admin-dash-chart-titles">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="admin-dash-chart-meta">
          {total ? <span className="admin-dash-chart-total">{total}</span> : null}
          {action}
        </div>
      </header>
      <div className="admin-dash-chart-body">{children}</div>
    </article>
  );
}
