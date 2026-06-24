import { Bell, Check } from '@/icons';
import { NotificationBadge } from './NotificationBadge';
import {
  fmtRelativeTime,
  IMPORTANT_TYPES,
  NOTIFICATION_TYPE_LABELS,
  TYPE_VISUAL,
  type InstructorNotification,
} from './types';

interface NotificationCardProps {
  item: InstructorNotification;
  busy?: boolean;
  onMarkRead: (id: number) => void;
}

export function NotificationCard({ item, busy, onMarkRead }: NotificationCardProps) {
  const visual = TYPE_VISUAL[item.type] || { tone: 'system', icon: Bell };
  const Icon = visual.icon;
  const typeLabel = NOTIFICATION_TYPE_LABELS[item.type] || 'إشعار';
  const isImportant = !item.isRead && IMPORTANT_TYPES.has(item.type);

  return (
    <article
      className={`ntf-row ${item.isRead ? 'is-read' : 'is-unread'} ${isImportant ? 'is-important' : ''}`}
    >
      {!item.isRead ? <span className="ntf-unread-dot" aria-hidden="true" /> : null}

      <div className={`ntf-row-icon is-${visual.tone}`} aria-hidden="true">
        <Icon size={18} />
      </div>

      <div className="ntf-row-body">
        <div className="ntf-row-title-line">
          <h3>{item.titleAr}</h3>
          <NotificationBadge variant="type" label={typeLabel} />
        </div>
        <p className="ntf-row-text">{item.bodyAr}</p>
      </div>

      <div className="ntf-row-meta">
        <NotificationBadge
          variant={isImportant ? 'important' : item.isRead ? 'read' : 'unread'}
          label={item.isRead ? 'مقروء' : isImportant ? 'مهم' : 'جديد'}
        />
        <time className="ntf-row-time" dateTime={item.createdAt}>
          {fmtRelativeTime(item.createdAt)}
        </time>
        {!item.isRead ? (
          <button
            type="button"
            className="ntf-mark-read-btn"
            onClick={() => onMarkRead(item.id)}
            disabled={busy}
          >
            {busy ? <span className="ntf-btn-spinner" /> : <Check size={14} />}
            <span>تعليم كمقروء</span>
          </button>
        ) : (
          <span className="ntf-read-indicator">
            <Check size={14} aria-hidden="true" />
            تمت القراءة
          </span>
        )}
      </div>
    </article>
  );
}
