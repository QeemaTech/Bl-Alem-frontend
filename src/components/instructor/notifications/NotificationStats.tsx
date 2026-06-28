import { useTranslation } from 'react-i18next';
import { AlertCircle, Bell, BellOff, CalendarDays, TrendingUp } from '@/icons';
import type { LucideIcon } from '@/icons';
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
  const { t } = useTranslation('notifications');

  return (
    <section className="ntf-stats-grid" aria-label={t('instructor.stats.ariaLabel')}>
      <StatCard
        title={t('instructor.stats.total')}
        value={String(stats.total)}
        trend="100%"
        icon={Bell}
        tone="total"
      />
      <StatCard
        title={t('instructor.stats.unread')}
        value={String(stats.unread)}
        trend={t('instructor.stats.ofTotal', { pct: pctOfTotal(stats.unread, stats.total) })}
        icon={BellOff}
        tone="unread"
      />
      <StatCard
        title={t('instructor.stats.attention')}
        value={String(stats.attention)}
        trend={stats.attention ? t('instructor.stats.highPriority') : t('instructor.stats.none')}
        icon={AlertCircle}
        tone="attention"
      />
      <StatCard
        title={t('instructor.stats.todayNotifications')}
        value={String(stats.today)}
        trend={t('instructor.stats.ofTotal', { pct: pctOfTotal(stats.today, stats.total) })}
        icon={CalendarDays}
        tone="today"
      />
    </section>
  );
}
