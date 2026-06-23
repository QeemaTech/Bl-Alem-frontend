import { AlertCircle, Bell, BellOff, CalendarDays, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { pctOfTotal } from './types';

interface NotificationStatsData {
  total: number;
  unread: number;
  attention: number;
  today: number;
}

interface NotificationStatsProps {
  stats: NotificationStatsData;
}

function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone: 'total' | 'unread' | 'attention' | 'today';
}) {
  return (
    <article className={`ntf-stat-card is-${tone}`}>
      <div className="ntf-stat-top">
        <span className="ntf-stat-icon" aria-hidden="true"><Icon size={18} /></span>
        <span className="ntf-stat-trend">
          <TrendingUp size={12} aria-hidden="true" />
          {trend}
        </span>
      </div>
      <strong className="ntf-stat-value">{value}</strong>
      <p className="ntf-stat-label">{title}</p>
    </article>
  );
}

export function NotificationStats({ stats }: NotificationStatsProps) {
  return (
    <section className="ntf-stats-grid" aria-label="إحصائيات الإشعارات">
      <StatCard
        title="إجمالي الإشعارات"
        value={String(stats.total)}
        trend="100%"
        icon={Bell}
        tone="total"
      />
      <StatCard
        title="غير مقروء"
        value={String(stats.unread)}
        trend={`${pctOfTotal(stats.unread, stats.total)} من الإجمالي`}
        icon={BellOff}
        tone="unread"
      />
      <StatCard
        title="تحتاج متابعة"
        value={String(stats.attention)}
        trend={stats.attention ? 'أولوية عالية' : 'لا يوجد'}
        icon={AlertCircle}
        tone="attention"
      />
      <StatCard
        title="إشعارات اليوم"
        value={String(stats.today)}
        trend={`${pctOfTotal(stats.today, stats.total)} من الإجمالي`}
        icon={CalendarDays}
        tone="today"
      />
    </section>
  );
}
