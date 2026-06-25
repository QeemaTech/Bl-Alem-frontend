import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Star } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReviewsTable } from '../../components/admin/reviews/ReviewsTable';
import { fmtReviewDate, type ReviewItem } from '../../components/admin/reviews/reviewShared';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const exportColumns = [
  { key: 'id', header: 'رقم التقييم' },
  { key: 'student', header: 'الطالب' },
  { key: 'email', header: 'البريد' },
  { key: 'course', header: 'الكورس' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'rating', header: 'التقييم' },
  { key: 'comment', header: 'التعليق' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function AdminReviewsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.reviews());
    } catch {
      showToast('تعذّر تحميل التقييمات.', 'error');
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
      label: `${star} نجوم`,
      value: items.filter((i) => i.rating === star).length,
    }))
  ), [items]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteReview(deleteTarget.id);
      showToast('تم حذف التقييم.', 'success');
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر حذف التقييم.';
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'التقييمات',
      exportColumns,
      filteredItems.map((row) => ({
        id: row.id,
        student: row.user?.fullName || '—',
        email: row.user?.email || '—',
        course: row.course?.titleAr || '—',
        instructor: row.course?.instructor?.fullName || '—',
        rating: `${row.rating}/5`,
        comment: row.comment || '—',
        createdAt: fmtReviewDate(row.createdAt),
      })),
    );
  };

  return (
    <div className="page-grid admin-reviews-page">
      <div className="reports-header">
        <PageHeader
          title="التقييمات"
          subtitle="مراجعة تقييمات الطلاب على الكورسات"
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleExport}
            disabled={!filteredItems.length}
          >
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي التقييمات" value={String(stats.total)} icon={Star} />
        <StatCard title="متوسط التقييم" value={stats.avg.toFixed(1)} icon={Star} />
        <StatCard title="تقييم 5 نجوم" value={String(stats.fiveStar)} icon={Star} />
        <StatCard title="تقييمات منخفضة (1-2)" value={String(stats.lowRating)} icon={Star} />
      </div>

      {items.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع التقييمات" type="bar" data={ratingChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالطالب، الكورس، المحاضر، أو التعليق..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRatingFilter(''); }}
      >
        <Select
          label="عدد النجوم"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          options={[
            { label: 'كل التقييمات', value: '' },
            { label: '5 نجوم', value: '5' },
            { label: '4 نجوم', value: '4' },
            { label: '3 نجوم', value: '3' },
            { label: '2 نجوم', value: '2' },
            { label: '1 نجمة', value: '1' },
          ]}
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
        title="حذف التقييم"
        message={`هل أنت متأكد من حذف تقييم ${deleteTarget?.user?.fullName || 'الطالب'} على كورس "${deleteTarget?.course?.titleAr || '—'}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
