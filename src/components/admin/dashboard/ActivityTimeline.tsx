import {
  BookOpen,
  CoPresent,
  CreditCard,
  Headphones,
  UserPlus,
} from '@/icons';
import type { MaterialIcon } from '@/icons';
import { EmptyState } from '../../ui/EmptyState';
import { fmtTimeAgo } from './dashboardFormat';
import type { ActivityItem, ActivityType } from './dashboardTypes';

const ACTIVITY_META: Record<ActivityType, { icon: MaterialIcon; label: string }> = {
  registration: { icon: UserPlus, label: 'تسجيل' },
  course: { icon: BookOpen, label: 'كورس' },
  payment: { icon: CreditCard, label: 'دفع' },
  support: { icon: Headphones, label: 'دعم' },
  instructor: { icon: CoPresent, label: 'محاضر' },
};

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <section className="admin-dash-timeline-section" aria-label="النشاط الأخير">
      <header className="admin-dash-section-head is-compact">
        <div>
          <h2>النشاط الأخير</h2>
          <p>آخر التحديثات على المنصة</p>
        </div>
      </header>

      {items.length ? (
        <ol className="admin-dash-timeline" aria-label="جدول زمني للنشاط">
          {items.map((item) => {
            const meta = ACTIVITY_META[item.type];
            const Icon = meta.icon;
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
                  <span className="admin-dash-timeline-tag">{meta.label}</span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          icon={Headphones}
          title="لا يوجد نشاط حديث"
          description="ستظهر هنا التسجيلات والمدفوعات والتذاكر فور حدوثها."
        />
      )}
    </section>
  );
}
