import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatDateTime } from '../../utils/localeFormat';
import { localizedCourseTitle } from '../../utils/localizedContent';

const RATING_BAR_COLORS: Record<number, string> = {
  1: '#FFFBEB',
  2: '#FEF9C3',
  3: '#FEF08A',
  4: '#FDE68A',
  5: '#FCD34D',
};

/** Placeholder — connect to instructor reply API when available */
async function onSubmitReply(reviewId: number, replyText: string): Promise<void> {
  void reviewId;
  void replyText;
  await new Promise((resolve) => setTimeout(resolve, 600));
}

function ratingVariant(rating: number) {
  if (rating >= 4) return 'success' as const;
  if (rating === 3) return 'warning' as const;
  return 'rejected' as const;
}

interface ReviewCardProps {
  review: any;
  existingReply: string;
  onDetails: () => void;
  onReplySaved: (reviewId: number, replyText: string) => void;
  lang: string;
  starsAria: (rating: number) => string;
  ratingLabel: (rating: number) => string;
  fmtDate: (value: string) => string;
  dash: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  tc: (key: string) => string;
}

function ReviewCard({
  review,
  existingReply,
  onDetails,
  onReplySaved,
  lang,
  starsAria,
  ratingLabel,
  fmtDate,
  dash,
  t,
  tc,
}: ReviewCardProps) {
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

  const value = Math.max(0, Math.min(5, Number(review.rating) || 0));

  return (
    <article className="review-item">
      <div className="review-item-avatar">
        {(review.user?.fullName || '?').slice(0, 1)}
      </div>

      <div className="review-item-body">
        <div className="review-item-top">
          <div>
            <h3>{review.user?.fullName || t('labels.studentFallback')}</h3>
            <p className="review-item-course">{localizedCourseTitle(review.course, lang) || dash}</p>
          </div>
          <div className="review-item-meta">
            <Badge variant={ratingVariant(Number(review.rating))}>
              {ratingLabel(Number(review.rating))}
            </Badge>
            <span className="review-stars" aria-label={starsAria(value)}>
              {Array.from({ length: 5 }).map((_, index) => {
                const filled = index < value;
                return (
                  <Star
                    key={index}
                    size={14}
                    className={filled ? 'review-star is-filled' : 'review-star'}
                    {...(filled ? { fill: 'currentColor' } : {})}
                    aria-hidden="true"
                  />
                );
              })}
              <strong className="review-stars-score">{t('labels.ratingOf', { rating: value })}</strong>
            </span>
          </div>
        </div>

        {review.comment?.trim() ? (
          <p className="review-item-comment">{review.comment}</p>
        ) : (
          <p className="review-item-comment muted">{t('instructor.noComment')}</p>
        )}

        {existingReply && !showReplyBox ? (
          <div className="review-reply-block">
            <p className="review-reply-label">{t('instructor.reply.yourReply')}</p>
            <p className="review-reply-text">{existingReply}</p>
            <button type="button" className="review-reply-edit" onClick={openReplyBox}>
              {t('instructor.reply.editReply')}
            </button>
          </div>
        ) : null}

        {showReplyBox ? (
          <div className="review-reply-form">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder={t('instructor.reply.placeholder')}
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
                {isSubmitting ? t('instructor.reply.submitting') : t('instructor.reply.submit')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReplyBox(false)}
                disabled={isSubmitting}
              >
                {tc('actions.cancel')}
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
          {t('actions.details')}
        </Button>
        {!showReplyBox && !existingReply ? (
          <Button variant="ghost" size="sm" className="review-reply-trigger" onClick={openReplyBox}>
            {t('instructor.reply.reply')}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function InstructorReviewsPage() {
  const { t, i18n } = useTranslation('reviews');
  const { t: tc } = useTranslation('common');
  const { t: tl } = useTranslation('liveSessions');
  const lang = i18n.language;
  const dash = tl('empty');

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [replyOverrides, setReplyOverrides] = useState<Record<number, string>>({});

  const fmtDate = useCallback(
    (value: string) => formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang),
    [lang],
  );

  const starsAria = useCallback(
    (rating: number) => t('labels.starsAria', { rating }),
    [t, lang],
  );

  const ratingLabel = useCallback((rating: number) => {
    const key = Math.max(1, Math.min(5, Math.round(rating)));
    return t(`instructor.ratingLabels.${key}`);
  }, [t, lang]);

  const reviewPercentage = useCallback(
    (count: number, total: number) => (
      total > 0 ? t('instructor.stats.percentOfReviews', { percent: Math.round((count / total) * 100) }) : undefined
    ),
    [t, lang],
  );

  const exportColumns = useMemo(() => {
    const cols = t('export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'student', header: cols.student },
      { key: 'course', header: cols.course },
      { key: 'rating', header: cols.rating },
      { key: 'comment', header: cols.comment },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t, lang]);

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
        .map((r) => [r.course.id, { label: localizedCourseTitle(r.course, lang), value: String(r.course.id) }]),
    ).values()];
    return [{ label: t('instructor.filters.allCourses'), value: '' }, ...courses];
  }, [reviews, lang, t]);

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (ratingFilter) result = result.filter((r) => String(r.rating) === ratingFilter);
    if (courseFilter) result = result.filter((r) => String(r.course?.id) === courseFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) =>
        [r.user?.fullName, localizedCourseTitle(r.course, lang), r.comment]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [reviews, ratingFilter, courseFilter, search, lang]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / total : 0;
    const fiveStar = reviews.filter((r) => r.rating === 5).length;
    const withComment = reviews.filter((r) => r.comment?.trim()).length;
    return { total, avg, fiveStar, withComment };
  }, [reviews]);

  const ratingChart = useMemo(() => (
    [5, 4, 3, 2, 1].map((star) => ({
      label: star === 1 ? t('charts.oneStar') : t('charts.stars', { count: star }),
      value: reviews.filter((r) => r.rating === star).length,
      color: RATING_BAR_COLORS[star],
    }))
  ), [reviews, t, lang]);

  const getReviewReply = (review: any) => (
    replyOverrides[review.id] ?? review.instructorReply ?? ''
  );

  const handleExport = () => {
    exportTableToExcel(t('instructor.export.sheetName'), exportColumns, filteredReviews.map((row) => ({
      student: row.user?.fullName || dash,
      course: localizedCourseTitle(row.course, lang) || dash,
      rating: t('labels.ratingOf', { rating: row.rating }),
      comment: row.comment || dash,
      createdAt: fmtDate(row.createdAt),
    })));
  };

  const ratingOptions = useMemo(() => [
    { label: tc('status.all'), value: '' },
    { label: t('charts.stars', { count: 5 }), value: '5' },
    { label: t('charts.stars', { count: 4 }), value: '4' },
    { label: t('charts.stars', { count: 3 }), value: '3' },
    { label: t('charts.stars', { count: 2 }), value: '2' },
    { label: t('charts.oneStar'), value: '1' },
  ], [t, tc, lang]);

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('title')}
          subtitle={t('instructor.subtitle')}
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filteredReviews.length}>
          {t('actions.exportExcel')}
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total')} value={String(stats.total)} icon={MessageSquare} />
        <StatCard title={t('stats.average')} value={stats.avg.toFixed(1)} icon={Star} hint={t('instructor.stats.avgHint')} />
        <StatCard
          title={t('stats.fiveStar')}
          value={String(stats.fiveStar)}
          icon={ThumbsUp}
          hint={reviewPercentage(stats.fiveStar, stats.total)}
        />
        <StatCard
          title={t('instructor.stats.withComment')}
          value={String(stats.withComment)}
          icon={MessageSquare}
          hint={reviewPercentage(stats.withComment, stats.total)}
        />
      </div>

      {reviews.length ? (
        <div className="reports-charts-grid">
          <ReportChart title={t('charts.distribution')} type="bar" data={ratingChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('instructor.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRatingFilter(''); setCourseFilter(''); }}
      >
        <Select
          label={t('filters.rating')}
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          options={ratingOptions}
        />
        <Select
          label={t('instructor.filters.course')}
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
              lang={lang}
              starsAria={starsAria}
              ratingLabel={ratingLabel}
              fmtDate={fmtDate}
              dash={dash}
              t={t}
              tc={tc}
            />
          ))}
        </div>
      ) : reviews.length ? (
        <Card>
          <EmptyState title={t('instructor.empty.noResults')} description={t('instructor.empty.noResultsDesc')} icon={Star} />
        </Card>
      ) : (
        <Card>
          <EmptyState title={t('table.emptyTitle')} description={t('instructor.empty.noReviewsDesc')} icon={Star} />
        </Card>
      )}

      <Modal isOpen={Boolean(selected)} title={t('instructor.detail.title')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{t('detail.student')}</span><strong>{selected.user?.fullName || dash}</strong></div>
            <div className="detail-row"><span>{t('detail.course')}</span><strong>{localizedCourseTitle(selected.course, lang) || dash}</strong></div>
            <div className="detail-row">
              <span>{t('table.columns.rating')}</span>
              <span className="review-stars" aria-label={starsAria(Number(selected.rating))}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const filled = index < Number(selected.rating);
                  return (
                    <Star
                      key={index}
                      size={14}
                      className={filled ? 'review-star is-filled' : 'review-star'}
                      {...(filled ? { fill: 'currentColor' } : {})}
                      aria-hidden="true"
                    />
                  );
                })}
              </span>
            </div>
            <div className="detail-row"><span>{t('instructor.detail.date')}</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            <div className="admin-notification-body">
              <strong>{t('detail.comment')}</strong>
              <p>{selected.comment?.trim() || dash}</p>
            </div>
            {getReviewReply(selected) ? (
              <div className="review-reply-block">
                <p className="review-reply-label">{t('instructor.reply.yourReplyShort')}</p>
                <p className="review-reply-text">{getReviewReply(selected)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
