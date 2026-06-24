<<<<<<< Updated upstream
﻿import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import { Card } from './Card';
=======
﻿import type { MaterialIcon } from '@/icons';
import { cn } from '@/lib/cn';
>>>>>>> Stashed changes

interface StatCardProps {
  title: string;
  value: string;
  icon: MaterialIcon;
  trend?: string;
<<<<<<< Updated upstream
  icon: LucideIcon;
  tooltip?: string;
}

export function StatCard({ title, value, hint, trend, icon: Icon, tooltip }: StatCardProps) {
  return (
    <Card className="stat-card" variant="stat">
      <span className="stat-icon"><Icon size={22} aria-hidden="true" /></span>
      <div>
        <p className="stat-card-title">
          <span>{title}</span>
          {tooltip ? (
            <span
              className="stat-card-info"
              tabIndex={0}
              role="note"
              aria-label={tooltip}
              data-tooltip={tooltip}
            >
              <Info size={14} aria-hidden="true" />
            </span>
          ) : null}
        </p>
=======
  hint?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, hint, trendUp, className }: StatCardProps) {
  const subtitle = hint || trend;
  return (
    <article className={cn('stat-card card', className)}>
      <div className="stat-icon" aria-hidden>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p>{title}</p>
>>>>>>> Stashed changes
        <strong>{value}</strong>
        {subtitle ? (
          <small style={{ color: trendUp ? 'var(--color-success)' : 'var(--color-on-surface-variant)' }}>
            {subtitle}
          </small>
        ) : null}
      </div>
    </article>
  );
}
