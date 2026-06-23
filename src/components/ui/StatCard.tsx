import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  trend?: string;
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
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
        {trend ? <small style={{ color: 'var(--success)' }}>{trend}</small> : null}
      </div>
    </Card>
  );
}
