import { useEffect, useState } from 'react';
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
        showToast('تعذّر تحميل التقييم.', 'error');
        setReview(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reviewId]);

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(review.id);
      showToast('تم حذف التقييم.', 'success');
      navigate('/admin/reviews');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر حذف التقييم.';
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
          title="التقييم غير موجود"
          description="لم نتمكن من العثور على هذا التقييم."
        />
        <Button variant="outline" onClick={() => navigate('/admin/reviews')}>
          العودة للتقييمات
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-review-detail-page">
      <div className="admin-review-detail-toolbar">
        <Link to="/admin/reviews" className="support-ticket-back">
          <ArrowRight size={18} aria-hidden="true" />
          العودة للتقييمات
        </Link>
        <Button
          variant="danger"
          icon={<Trash2 size={18} />}
          onClick={() => setDeleteOpen(true)}
        >
          حذف التقييم
        </Button>
      </div>

      <Card className="support-ticket-page-card">
        <ReviewDetail review={review} />
      </Card>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="حذف التقييم"
        message={`هل أنت متأكد من حذف تقييم ${review.user?.fullName || 'الطالب'} على كورس "${review.course?.titleAr || '—'}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
