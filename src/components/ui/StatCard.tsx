import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  trend?: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, hint, trend, icon: Icon }: StatCardProps) {
  return (
    <Card className="stat-card" variant="stat">
      <span className="stat-icon"><Icon size={22} /></span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
        {trend ? <small style={{ color: 'var(--success)' }}>{trend}</small> : null}
      </div>
    </Card>
  );
}
