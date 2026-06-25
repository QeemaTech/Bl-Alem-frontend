import { Badge } from '../../ui/Badge';
import { fmtNotificationDate, roleLabels, typeLabels } from './notificationShared';

interface NotificationDetailProps {
  notification: any;
}

export function NotificationDetail({ notification }: NotificationDetailProps) {
  return (
    <div className="support-ticket-detail admin-notification-detail">
      <div className="support-ticket-detail-header">
        <div>
          <span className="support-ticket-id">#{notification.id}</span>
          <h2>{notification.titleAr}</h2>
        </div>
        <Badge
          variant={notification.isRead ? 'default' : 'info'}
          dot
          className="status-badge"
        >
          {notification.isRead ? 'مقروء' : 'غير مقروء'}
        </Badge>
      </div>

      <div className="support-ticket-user-card">
        <strong>{notification.user?.fullName || '—'}</strong>
        <span>{notification.user?.email || '—'}</span>
        <span>{roleLabels[notification.user?.role] || notification.user?.role || '—'}</span>
        {notification.user?.phone ? <span>{notification.user.phone}</span> : null}
      </div>

      <div className="admin-notification-meta">
        <div className="detail-row">
          <span>النوع</span>
          <strong>{typeLabels[notification.type] || notification.type || '—'}</strong>
        </div>
        <div className="detail-row">
          <span>تاريخ الإرسال</span>
          <strong>{fmtNotificationDate(notification.createdAt)}</strong>
        </div>
      </div>

      <div className="admin-notification-body">
        <strong>{notification.titleAr}</strong>
        <p>{notification.bodyAr}</p>
      </div>
    </div>
  );
}
