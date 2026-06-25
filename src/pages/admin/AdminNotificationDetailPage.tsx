import { useEffect, useState } from 'react';
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
        showToast('تعذّر تحميل الإشعار.', 'error');
        setNotification(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [notificationId]);

  if (loading) return <DashboardSkeleton />;

  if (!notification) {
    return (
      <div className="page-grid admin-notification-detail-page">
        <EmptyState
          title="الإشعار غير موجود"
          description="لم نتمكن من العثور على هذا الإشعار."
        />
        <Button variant="outline" onClick={() => navigate('/admin/notifications')}>
          العودة للإشعارات
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-notification-detail-page">
      <Link to="/admin/notifications" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة للإشعارات
      </Link>

      <Card className="support-ticket-page-card">
        <NotificationDetail notification={notification} />
      </Card>
    </div>
  );
}
