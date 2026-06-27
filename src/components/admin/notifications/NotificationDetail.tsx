import { useTranslation } from 'react-i18next';
import { useAdminNotificationLabels } from '../../../hooks/useAdminNotificationLabels';
import { Badge } from '../../ui/Badge';

interface NotificationDetailProps {
  notification: any;
}

export function NotificationDetail({ notification }: NotificationDetailProps) {
  const {
    getTypeLabel,
    getRoleLabel,
    getReadStatusLabel,
    fmtNotificationDate,
    empty,
  } = useAdminNotificationLabels();
  const { t } = useTranslation('notifications');

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
          {getReadStatusLabel(notification.isRead)}
        </Badge>
      </div>

      <div className="support-ticket-user-card">
        <strong>{notification.user?.fullName || empty}</strong>
        <span>{notification.user?.email || empty}</span>
        <span>{getRoleLabel(notification.user?.role) || empty}</span>
        {notification.user?.phone ? <span>{notification.user.phone}</span> : null}
      </div>

      <div className="admin-notification-meta">
        <div className="detail-row">
          <span>{t('admin.detail.type')}</span>
          <strong>{getTypeLabel(notification.type) || empty}</strong>
        </div>
        <div className="detail-row">
          <span>{t('admin.detail.sentAt')}</span>
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
