import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { NotificationDetail } from '../../components/admin/notifications/NotificationDetail';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../components/ui/Toast';

export default function AdminNotificationDetailPage() {
  const { t } = useTranslation('notifications');
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notification, setNotification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!notificationId) return;
      setLoading(true);
      try {
        const data = await adminApi.notification(notificationId);
        if (!data.isRead) {
          setNotification(await adminApi.markNotificationRead(notificationId));
        } else {
          setNotification(data);
        }
      } catch {
        showToast(t('admin.toast.loadDetailFailed'), 'error');
        setNotification(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notificationId, showToast, t]);

  if (loading) return <DashboardSkeleton />;

  if (!notification) {
    return (
      <div className="page-grid admin-notification-detail-page">
        <EmptyState
          title={t('admin.detail.notFoundTitle')}
          description={t('admin.detail.notFoundDescription')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/notifications')}>
          {t('admin.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-notification-detail-page">
      <Link to="/admin/notifications" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('admin.backToList')}
      </Link>

      <Card className="support-ticket-page-card">
        <NotificationDetail notification={notification} />
      </Card>
    </div>
  );
}
