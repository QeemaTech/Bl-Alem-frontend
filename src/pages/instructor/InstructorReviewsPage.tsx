import { useEffect, useMemo, useState } from 'react';
import { Download, MessageSquare, Star, ThumbsUp } from 'lucide-react';
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

export default function InstructorReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

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
    }))
  ), [reviews]);

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
        <StatCard title="تقييم 5 نجوم" value={String(stats.fiveStar)} icon={ThumbsUp} />
        <StatCard title="مع تعليق" value={String(stats.withComment)} icon={MessageSquare} />
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
            <article key={review.id} className="review-item">
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

                <time className="review-item-time" dateTime={review.createdAt}>
                  {fmtDate(review.createdAt)}
                </time>
              </div>

              <div className="review-item-actions">
                <Button variant="ghost" size="sm" onClick={() => setSelected(review)}>
                  التفاصيل
                </Button>
              </div>
            </article>
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
