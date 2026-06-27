import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Trash2 } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReviewDetail } from '../../components/admin/reviews/ReviewDetail';
import type { ReviewItem } from '../../components/admin/reviews/reviewShared';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../components/ui/Toast';

export default function AdminReviewDetailPage() {
  const { t } = useTranslation('reviews');
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [review, setReview] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!reviewId) return;
      setLoading(true);
      try {
        setReview(await adminApi.review(reviewId));
      } catch {
        showToast(t('toast.loadDetailFailed'), 'error');
        setReview(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reviewId, t, showToast]);

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(review.id);
      showToast(t('toast.deleted'), 'success');
      navigate('/admin/reviews');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.deleteFailed');
      showToast(message, 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!review) {
    return (
      <div className="page-grid admin-review-detail-page">
        <EmptyState
          title={t('detail.notFoundTitle')}
          description={t('detail.notFoundDescription')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/reviews')}>
          {t('actions.backToReviews')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-review-detail-page">
      <div className="admin-review-detail-toolbar">
        <Link to="/admin/reviews" className="support-ticket-back">
          <ArrowRight size={18} aria-hidden="true" />
          {t('actions.backToReviews')}
        </Link>
        <Button
          variant="danger"
          icon={<Trash2 size={18} />}
          onClick={() => setDeleteOpen(true)}
        >
          {t('actions.deleteReview')}
        </Button>
      </div>

      <Card className="support-ticket-page-card">
        <ReviewDetail review={review} />
      </Card>

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage', {
          name: review.user?.fullName || t('labels.studentFallback'),
          course: review.course?.titleAr || t('empty'),
        })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
