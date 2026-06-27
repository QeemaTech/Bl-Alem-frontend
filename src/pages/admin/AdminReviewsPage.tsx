import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download, Star } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReviewsTable } from '../../components/admin/reviews/ReviewsTable';
import type { ReviewItem } from '../../components/admin/reviews/reviewShared';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { useAdminReviewLabels } from '../../hooks/useAdminReviewLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

export default function AdminReviewsPage() {
  const { t } = useTranslation(['reviews', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { fmtReviewDate, starLabel, ratingOf, empty } = useAdminReviewLabels();

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const exportColumns = useMemo(() => {
    const cols = t('export.columns', { returnObjects: true, ns: 'reviews' }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'student', header: cols.student },
      { key: 'email', header: cols.email },
      { key: 'course', header: cols.course },
      { key: 'instructor', header: cols.instructor },
      { key: 'rating', header: cols.rating },
      { key: 'comment', header: cols.comment },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.reviews());
    } catch {
      showToast(t('toast.loadFailed', { ns: 'reviews' }), 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = (item: ReviewItem) => navigate(`/admin/reviews/${item.id}`);

  const filteredItems = useMemo(() => {
    let result = items;
    if (ratingFilter) result = result.filter((i) => String(i.rating) === ratingFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.comment, i.user?.fullName, i.user?.email, i.course?.titleAr, i.course?.instructor?.fullName, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, ratingFilter, search]);

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? items.reduce((sum, i) => sum + Number(i.rating), 0) / total : 0;
    const fiveStar = items.filter((i) => i.rating === 5).length;
    const lowRating = items.filter((i) => i.rating <= 2).length;
    return { total, avg, fiveStar, lowRating };
  }, [items]);

  const ratingChart = useMemo(() => (
    [5, 4, 3, 2, 1].map((star) => ({
      label: starLabel(star),
      value: items.filter((i) => i.rating === star).length,
    }))
  ), [items, starLabel]);

  const ratingFilterOptions = useMemo(() => [
    { label: t('filters.allRatings', { ns: 'reviews' }), value: '' },
    ...[5, 4, 3, 2, 1].map((star) => ({
      label: starLabel(star),
      value: String(star),
    })),
  ], [t, starLabel]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(deleteTarget.id);
      showToast(t('toast.deleted', { ns: 'reviews' }), 'success');
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.deleteFailed', { ns: 'reviews' });
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('export.sheetName', { ns: 'reviews' }),
      exportColumns,
      filteredItems.map((row) => ({
        id: row.id,
        student: row.user?.fullName || empty,
        email: row.user?.email || empty,
        course: row.course?.titleAr || empty,
        instructor: row.course?.instructor?.fullName || empty,
        rating: ratingOf(row.rating),
        comment: row.comment || empty,
        createdAt: fmtReviewDate(row.createdAt),
      })),
    );
  };

  return (
    <div className="page-grid admin-reviews-page">
      <div className="reports-header">
        <PageHeader title={t('title', { ns: 'reviews' })} subtitle={t('subtitle', { ns: 'reviews' })} />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleExport}
            disabled={!filteredItems.length}
          >
            {t('actions.exportExcel', { ns: 'reviews' })}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total', { ns: 'reviews' })} value={String(stats.total)} icon={Star} />
        <StatCard title={t('stats.average', { ns: 'reviews' })} value={stats.avg.toFixed(1)} icon={Star} />
        <StatCard title={t('stats.fiveStar', { ns: 'reviews' })} value={String(stats.fiveStar)} icon={Star} />
        <StatCard title={t('stats.lowRating', { ns: 'reviews' })} value={String(stats.lowRating)} icon={Star} />
      </div>

      {items.length ? (
        <div className="reports-charts-grid">
          <ReportChart title={t('charts.distribution', { ns: 'reviews' })} type="bar" data={ratingChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('filters.searchPlaceholder', { ns: 'reviews' })}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRatingFilter(''); }}
      >
        <Select
          label={t('filters.rating', { ns: 'reviews' })}
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          options={ratingFilterOptions}
        />
      </FilterBar>

      <ReviewsTable
        items={filteredItems}
        loading={loading}
        onDetail={openDetail}
        onDelete={setDeleteTarget}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('confirm.deleteTitle', { ns: 'reviews' })}
        message={t('confirm.deleteMessage', {
          ns: 'reviews',
          name: deleteTarget?.user?.fullName || t('labels.studentFallback', { ns: 'reviews' }),
          course: deleteTarget?.course?.titleAr || empty,
        })}
        confirmLabel={t('actions.delete', { ns: 'reviews' })}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
