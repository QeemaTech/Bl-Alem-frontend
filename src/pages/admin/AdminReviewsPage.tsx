import { useEffect, useMemo, useState } from 'react';
import { Download, Star, Trash2 } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.reviews());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  const ratingChart = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} نجوم`,
      value: items.filter((i) => i.rating === star).length,
    }));
    return counts;
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    student: row.user?.fullName || '—',
    email: row.user?.email || '—',
    course: row.course?.titleAr || '—',
    instructor: row.course?.instructor?.fullName || '—',
    rating: `${row.rating}/5`,
    comment: row.comment?.length > 40 ? `${row.comment.slice(0, 40)}...` : (row.comment || '—'),
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteReview(deleteTarget.id);
    showToast('تم حذف التقييم.', 'success');
    setDeleteTarget(null);
    if (selected?.id === deleteTarget.id) setSelected(null);
    load();
  };

  const handleExport = () => {
    exportTableToExcel(
      'التقييمات',
      exportColumns,
      tableRows.map(({ _raw, comment, ...row }) => ({
        ...row,
        comment: _raw.comment || comment,
      })),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="التقييمات"
          subtitle="مراجعة تقييمات الطلاب على الكورسات"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
          تصدير Excel
        </Button>
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

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد تقييمات"
          emptyDescription="لم يتم إضافة أي تقييمات بعد."
          columns={[
            { key: 'id', header: 'رقم التقييم' },
            { key: 'student', header: 'الطالب' },
            { key: 'course', header: 'الكورس' },
            { key: 'instructor', header: 'المحاضر' },
            {
              key: 'rating',
              header: 'التقييم',
              render: (row) => (
                <div className="review-rating-cell">
                  <Stars rating={Number(row._raw?.rating || 0)} />
                  <Badge variant={ratingVariant(Number(row._raw?.rating || 0))}>
                    {row.rating}
                  </Badge>
                </div>
              ),
            },
            { key: 'comment', header: 'التعليق' },
            { key: 'createdAt', header: 'التاريخ' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => (
                <div className="card-actions">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(row._raw)}>
                    التفاصيل
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row._raw)}>
                    حذف
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title="تفاصيل التقييم" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم التقييم</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>الطالب</span><strong>{selected.user?.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.user?.email}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr}</strong></div>
            <div className="detail-row"><span>المحاضر</span><strong>{selected.course?.instructor?.fullName || '—'}</strong></div>
            <div className="detail-row">
              <span>التقييم</span>
              <Stars rating={Number(selected.rating)} />
            </div>
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            <div className="admin-notification-body">
              <strong>التعليق</strong>
              <p>{selected.comment || '—'}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف التقييم"
        message={`هل أنت متأكد من حذف تقييم ${deleteTarget?.user?.fullName} على كورس "${deleteTarget?.course?.titleAr}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
