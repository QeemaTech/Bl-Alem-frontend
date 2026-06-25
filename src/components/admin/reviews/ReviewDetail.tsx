import { Badge } from '../../ui/Badge';
import { fmtReviewDate, ratingVariant, type ReviewItem } from './reviewShared';
import { ReviewStars } from './ReviewStars';

interface ReviewDetailProps {
  review: ReviewItem;
}

export function ReviewDetail({ review }: ReviewDetailProps) {
  const rating = Number(review.rating) || 0;

  return (
    <div className="support-ticket-detail admin-review-detail">
      <div className="support-ticket-detail-header">
        <div>
          <span className="support-ticket-id">#{review.id}</span>
          <h2>تقييم كورس {review.course?.titleAr || '—'}</h2>
        </div>
        <Badge variant={ratingVariant(rating)} dot className="status-badge">
          {rating}/5
        </Badge>
      </div>

      <div className="admin-review-rating-banner">
        <ReviewStars rating={rating} size={20} />
        <span>{fmtReviewDate(review.createdAt)}</span>
      </div>

      <div className="admin-review-meta-grid">
        <div className="admin-review-meta-card">
          <span>الطالب</span>
          <strong>{review.user?.fullName || '—'}</strong>
          <small>{review.user?.email || '—'}</small>
          {review.user?.phone ? <small>{review.user.phone}</small> : null}
        </div>
        <div className="admin-review-meta-card">
          <span>الكورس</span>
          <strong>{review.course?.titleAr || '—'}</strong>
          {review.course?.id ? <small>رقم الكورس: {review.course.id}</small> : null}
        </div>
        <div className="admin-review-meta-card">
          <span>المحاضر</span>
          <strong>{review.course?.instructor?.fullName || '—'}</strong>
          {review.course?.instructor?.email ? <small>{review.course.instructor.email}</small> : null}
        </div>
      </div>

      <div className="admin-review-comment">
        <strong>التعليق</strong>
        <p>{review.comment?.trim() || 'لا يوجد تعليق مكتوب.'}</p>
      </div>
    </div>
  );
}
