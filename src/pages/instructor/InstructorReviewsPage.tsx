import { useEffect, useMemo, useState } from 'react';
import { Download, MessageSquare, Star, ThumbsUp } from '@/icons';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { exportTableToExcel } from '../../utils/exportExcel';

const RATING_BAR_COLORS: Record<number, string> = {
  1: '#FFFBEB',
  2: '#FEF9C3',
  3: '#FEF08A',
  4: '#FDE68A',
  5: '#FCD34D',
};

const reviewPercentage = (count: number, total: number) => (
  total > 0 ? `${Math.round((count / total) * 100)}% من التقييمات` : undefined
);

/** Placeholder — connect to instructor reply API when available */
async function onSubmitReply(reviewId: number, replyText: string): Promise<void> {
  void reviewId;
  void replyText;
  await new Promise((resolve) => setTimeout(resolve, 600));
}

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const exportColumns = [
  { key: 'student', header: 'الطالب' },
  { key: 'course', header: 'الكورس' },
  { key: 'rating', header: 'التقييم' },
  { key: 'comment', header: 'التعليق' },
  { key: 'createdAt', header: 'التاريخ' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < rating ? 'var(--warning)' : 'transparent'}
          color={i < rating ? 'var(--warning)' : 'var(--border)'}
        />
      ))}
      <strong>{rating}/5</strong>
    </span>
  );
}

function ratingVariant(rating: number) {
  if (rating >= 4) return 'success' as const;
  if (rating === 3) return 'warning' as const;
  return 'rejected' as const;
}

function ratingLabel(rating: number) {
  if (rating >= 5) return 'ممتاز';
  if (rating >= 4) return 'جيد جداً';
  if (rating >= 3) return 'جيد';
  if (rating >= 2) return 'ضعيف';
  return 'سيء';
}

interface ReviewCardProps {
  review: any;
  existingReply: string;
  onDetails: () => void;
  onReplySaved: (reviewId: number, replyText: string) => void;
}

function ReviewCard({ review, existingReply, onDetails, onReplySaved }: ReviewCardProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState(existingReply);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openReplyBox = () => {
    setReplyText(existingReply);
    setShowReplyBox(true);
  };

  const handleSubmitReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSubmitReply(review.id, trimmed);
      onReplySaved(review.id, trimmed);
      setShowReplyBox(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="review-item">
      <div className="review-item-avatar">
        {(review.user?.fullName || '?').slice(0, 1)}
      </div>

      <div className="review-item-body">
        <div className="review-item-top">
          <div>
            <h3>{review.user?.fullName || 'طالب'}</h3>
            <p className="review-item-course">{review.course?.titleAr || '—'}</p>
          </div>
          <div className="review-item-meta">
            <Badge variant={ratingVariant(Number(review.rating))}>
              {ratingLabel(Number(review.rating))}
            </Badge>
            <Stars rating={Number(review.rating)} />
          </div>
        </div>

        {review.comment?.trim() ? (
          <p className="review-item-comment">{review.comment}</p>
        ) : (
          <p className="review-item-comment muted">بدون تعليق نصي</p>
        )}

        {existingReply && !showReplyBox ? (
          <div className="review-reply-block">
            <p className="review-reply-label">ردك:</p>
            <p className="review-reply-text">{existingReply}</p>
            <button type="button" className="review-reply-edit" onClick={openReplyBox}>
              تعديل الرد
            </button>
          </div>
        ) : null}

        {showReplyBox ? (
          <div className="review-reply-form">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="اكتب ردك هنا..."
              className="input textarea review-reply-textarea"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="review-reply-form-actions">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyText.trim()}
                loading={isSubmitting}
              >
                {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الرد'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReplyBox(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : null}

        <time className="review-item-time" dateTime={review.createdAt}>
          {fmtDate(review.createdAt)}
        </time>
      </div>

      <div className="review-item-actions">
        <Button variant="ghost" size="sm" onClick={onDetails}>
          التفاصيل
        </Button>
        {!showReplyBox && !existingReply ? (
          <Button variant="ghost" size="sm" className="review-reply-trigger" onClick={openReplyBox}>
            رد
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function InstructorReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [replyOverrides, setReplyOverrides] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    setReviews(await instructorApi.reviews());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const courseOptions = useMemo(() => {
    const courses = [...new Map(
      reviews
        .filter((r) => r.course?.id)
        .map((r) => [r.course.id, { label: r.course.titleAr, value: String(r.course.id) }]),
    ).values()];
    return [{ label: 'كل الكورسات', value: '' }, ...courses];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (ratingFilter) result = result.filter((r) => String(r.rating) === ratingFilter);
    if (courseFilter) result = result.filter((r) => String(r.course?.id) === courseFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) =>
        [r.user?.fullName, r.course?.titleAr, r.comment]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [reviews, ratingFilter, courseFilter, search]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / total : 0;
    const fiveStar = reviews.filter((r) => r.rating === 5).length;
    const withComment = reviews.filter((r) => r.comment?.trim()).length;
    return { total, avg, fiveStar, withComment };
  }, [reviews]);

  const ratingChart = useMemo(() => (
    [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} نجوم`,
      value: reviews.filter((r) => r.rating === star).length,
      color: RATING_BAR_COLORS[star],
    }))
  ), [reviews]);

  const getReviewReply = (review: any) => (
    replyOverrides[review.id] ?? review.instructorReply ?? ''
  );

  const handleExport = () => {
    exportTableToExcel('تقييمات-المحاضر', exportColumns, filteredReviews.map((row) => ({
      student: row.user?.fullName || '—',
      course: row.course?.titleAr || '—',
      rating: `${row.rating}/5`,
      comment: row.comment || '—',
      createdAt: fmtDate(row.createdAt),
    })));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="التقييمات"
          subtitle="اطّلع على آراء الطلاب في كورساتك وتابع جودة المحتوى"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filteredReviews.length}>
          تصدير Excel
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title="عدد التقييمات" value={String(stats.total)} icon={MessageSquare} />
        <StatCard title="متوسط التقييم" value={stats.avg.toFixed(1)} icon={Star} hint="من 5 نجوم" />
        <StatCard
          title="تقييم 5 نجوم"
          value={String(stats.fiveStar)}
          icon={ThumbsUp}
          hint={reviewPercentage(stats.fiveStar, stats.total)}
        />
        <StatCard
          title="مع تعليق"
          value={String(stats.withComment)}
          icon={MessageSquare}
          hint={reviewPercentage(stats.withComment, stats.total)}
        />
      </div>

      {reviews.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع التقييمات" type="bar" data={ratingChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالطالب، الكورس، أو التعليق..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRatingFilter(''); setCourseFilter(''); }}
      >
        <Select
          label="التقييم"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: '5 نجوم', value: '5' },
            { label: '4 نجوم', value: '4' },
            { label: '3 نجوم', value: '3' },
            { label: '2 نجوم', value: '2' },
            { label: '1 نجمة', value: '1' },
          ]}
        />
        <Select
          label="الكورس"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          options={courseOptions}
        />
      </FilterBar>

      {loading ? (
        <LoadingSkeleton variant="row" count={4} />
      ) : filteredReviews.length ? (
        <div className="reviews-feed">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              existingReply={getReviewReply(review)}
              onDetails={() => setSelected(review)}
              onReplySaved={(reviewId, replyText) => {
                setReplyOverrides((prev) => ({ ...prev, [reviewId]: replyText }));
              }}
            />
          ))}
        </div>
      ) : reviews.length ? (
        <Card>
          <EmptyState title="لا نتائج" description="جرّب تغيير الفلاتر أو البحث." icon={Star} />
        </Card>
      ) : (
        <Card>
          <EmptyState title="لا توجد تقييمات" description="ستظهر تقييمات الطلاب هنا بعد إكمالهم للدورات." icon={Star} />
        </Card>
      )}

      <Modal isOpen={Boolean(selected)} title="تفاصيل التقييم" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الطالب</span><strong>{selected.user?.fullName || '—'}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row">
              <span>التقييم</span>
              <Stars rating={Number(selected.rating)} />
            </div>
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            <div className="admin-notification-body">
              <strong>التعليق</strong>
              <p>{selected.comment?.trim() || '—'}</p>
            </div>
            {getReviewReply(selected) ? (
              <div className="review-reply-block">
                <p className="review-reply-label">ردك</p>
                <p className="review-reply-text">{getReviewReply(selected)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
