import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CoPresent,
  CreditCard,
  Headphones,
  UserPlus,
} from '@/icons';
import type { MaterialIcon } from '@/icons';
import { EmptyState } from '../../ui/EmptyState';
import { useDashboardFormatters } from '../../../hooks/useDashboardAnalytics';
import type { ActivityItem, ActivityType } from './dashboardTypes';

const ACTIVITY_ICONS: Record<ActivityType, MaterialIcon> = {
  registration: UserPlus,
  course: BookOpen,
  payment: CreditCard,
  support: Headphones,
  instructor: CoPresent,
};

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  const { t } = useTranslation('dashboard');
  const { fmtTimeAgo } = useDashboardFormatters();

  const activityLabel = (type: ActivityType) =>
    t(`admin.dashboard.activity.types.${type}`);

  return (
    <section className="admin-dash-timeline-section" aria-label={t('admin.dashboard.activity.ariaLabel')}>
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>{t('admin.dashboard.activity.title')}</h2>
          <p>{t('admin.dashboard.activity.subtitle')}</p>
        </div>
      </header>

      {items.length ? (
        <ol className="admin-dash-timeline" aria-label={t('admin.dashboard.activity.ariaLabel')}>
          {items.map((item) => {
            const Icon = ACTIVITY_ICONS[item.type];
            return (
              <li key={item.id} className="admin-dash-timeline-item">
                <div className={`admin-dash-timeline-icon is-${item.type}`} aria-hidden>
                  <Icon size={18} />
                </div>
                <div className="admin-dash-timeline-content">
                  <div className="admin-dash-timeline-row">
                    <strong>{item.title}</strong>
                    <time dateTime={item.timestamp}>{fmtTimeAgo(item.timestamp)}</time>
                  </div>
                  <p>{item.description}</p>
                  <span className="admin-dash-timeline-tag">{activityLabel(item.type)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          icon={Headphones}
          title={t('admin.dashboard.activity.emptyTitle')}
          description={t('admin.dashboard.activity.emptyDesc')}
        />
      )}
    </section>
  );
}
