import { useTranslation } from 'react-i18next';
import { Badge } from '../../ui/Badge';
import { useAdminReviewLabels } from '../../../hooks/useAdminReviewLabels';
import { ratingVariant, type ReviewItem } from './reviewShared';
import { ReviewStars } from './ReviewStars';

interface ReviewDetailProps {
  review: ReviewItem;
}

export function ReviewDetail({ review }: ReviewDetailProps) {
  const { t } = useTranslation('reviews');
  const { fmtReviewDate, ratingOf } = useAdminReviewLabels();
  const rating = Number(review.rating) || 0;

  return (
    <div className="support-ticket-detail admin-review-detail">
      <div className="support-ticket-detail-header">
        <div>
          <span className="support-ticket-id">#{review.id}</span>
          <h2>{t('detail.title', { course: review.course?.titleAr || t('empty') })}</h2>
        </div>
        <Badge variant={ratingVariant(rating)} dot className="status-badge">
          {ratingOf(rating)}
        </Badge>
      </div>

      <div className="admin-review-rating-banner">
        <ReviewStars rating={rating} size={20} />
        <span>{fmtReviewDate(review.createdAt)}</span>
      </div>

      <div className="admin-review-meta-grid">
        <div className="admin-review-meta-card">
          <span>{t('detail.student')}</span>
          <strong>{review.user?.fullName || t('empty')}</strong>
          <small>{review.user?.email || t('empty')}</small>
          {review.user?.phone ? <small>{review.user.phone}</small> : null}
        </div>
        <div className="admin-review-meta-card">
          <span>{t('detail.course')}</span>
          <strong>{review.course?.titleAr || t('empty')}</strong>
          {review.course?.id ? <small>{t('detail.courseId', { id: review.course.id })}</small> : null}
        </div>
        <div className="admin-review-meta-card">
          <span>{t('detail.instructor')}</span>
          <strong>{review.course?.instructor?.fullName || t('empty')}</strong>
          {review.course?.instructor?.email ? <small>{review.course.instructor.email}</small> : null}
        </div>
      </div>

      <div className="admin-review-comment">
        <strong>{t('detail.comment')}</strong>
        <p>{review.comment?.trim() || t('detail.noComment')}</p>
      </div>
    </div>
  );
}
