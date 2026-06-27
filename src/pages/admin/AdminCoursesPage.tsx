import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, GraduationCap, Layers, Users } from '@/icons';
import { adminApi } from '../../api/admin';
import { CoursesTable } from '../../components/admin/courses/CoursesTable';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useAdminCourseLabels } from '../../hooks/useAdminCourseLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

export default function AdminCoursesPage() {
  const { t } = useTranslation(['courses', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { statusLabels, levelLabels, fmtDate, fmtMoney, empty } = useAdminCourseLabels();

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const exportColumns = useMemo(() => {
    const cols = t('admin.courses.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'title', header: cols.title },
      { key: 'instructor', header: cols.instructor },
      { key: 'category', header: cols.category },
      { key: 'level', header: cols.level },
      { key: 'price', header: cols.price },
      { key: 'students', header: cols.students },
      { key: 'lessons', header: cols.lessons },
      { key: 'status', header: cols.status },
      { key: 'updatedAt', header: cols.updatedAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    const [courseData, categoryData] = await Promise.all([
      adminApi.courses(),
      adminApi.categories(),
    ]);
    setItems(courseData);
    setCategories(categoryData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (categoryFilter) result = result.filter((i) => String(i.categoryId) === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.titleAr,
          i.titleEn,
          i.instructor?.fullName,
          i.category?.nameAr,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, categoryFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((i) => i.status === 'PUBLISHED').length,
    pending: items.filter((i) => i.status === 'PENDING_REVIEW').length,
    draft: items.filter((i) => i.status === 'DRAFT').length,
    rejected: items.filter((i) => i.status === 'REJECTED').length,
    suspended: items.filter((i) => i.status === 'SUSPENDED').length,
    students: items.reduce((sum, i) => sum + Number(i.totalStudents || i._count?.enrollments || 0), 0),
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.status;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
    }));
  }, [items, statusLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    title: row.titleAr,
    instructor: row.instructor?.fullName || empty,
    category: row.category?.nameAr || empty,
    level: levelLabels[row.level] || row.level,
    price: fmtMoney(row),
    students: String(row.totalStudents ?? row._count?.enrollments ?? 0),
    lessons: String(row._count?.lessons ?? 0),
    status: statusLabels[row.status] || row.status,
    updatedAt: fmtDate(row.updatedAt),
    _raw: row,
  })), [filteredItems, statusLabels, levelLabels, fmtDate, fmtMoney, empty]);

  const openDetail = (course: any) => {
    navigate(`/admin/courses/${course.id}`);
  };

  const runAction = async (action: string, course: any, message: string) => {
    if (action === 'approve') await adminApi.approveCourse(course.id);
    if (action === 'publish') await adminApi.publishCourse(course.id);
    if (action === 'suspend') await adminApi.suspendCourse(course.id);
    showToast(message, 'success');
    setSuspendTarget(null);
    await load();
  };

  const submitReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await adminApi.rejectCourse(rejectTarget.id, rejectReason);
    showToast(t('admin.courses.toast.rejected'), 'success');
    setRejectTarget(null);
    setRejectReason('');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteCourse(deleteTarget.id);
    showToast(t('admin.courses.toast.deleted'), 'success');
    setDeleteTarget(null);
    await load();
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.courses.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid admin-courses-page">
      <div className="reports-header">
        <PageHeader title={t('admin.courses.title')} subtitle={t('admin.courses.subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('admin.actions.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('admin.courses.stats.total')} value={String(stats.total)} icon={BookOpen} />
        <StatCard title={t('admin.courses.stats.published')} value={String(stats.published)} icon={GraduationCap} />
        <StatCard title={t('admin.courses.stats.pending')} value={String(stats.pending)} icon={Layers} />
        <StatCard title={t('admin.courses.stats.draft')} value={String(stats.draft)} icon={BookOpen} />
        <StatCard title={t('admin.courses.stats.rejectedSuspended')} value={String(stats.rejected + stats.suspended)} icon={Layers} />
        <StatCard title={t('admin.courses.stats.totalStudents')} value={String(stats.students)} icon={Users} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('admin.courses.charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.courses.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
      >
        <Select
          label={t('admin.courses.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('admin.courses.filters.allStatuses'), value: '' },
            { label: statusLabels.DRAFT, value: 'DRAFT' },
            { label: statusLabels.PENDING_REVIEW, value: 'PENDING_REVIEW' },
            { label: statusLabels.APPROVED, value: 'APPROVED' },
            { label: statusLabels.PUBLISHED, value: 'PUBLISHED' },
            { label: statusLabels.REJECTED, value: 'REJECTED' },
            { label: statusLabels.SUSPENDED, value: 'SUSPENDED' },
          ]}
        />
        <Select
          label={t('admin.courses.filters.category')}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: t('admin.courses.filters.allCategories'), value: '' },
            ...categories.map((c) => ({ label: c.nameAr, value: String(c.id) })),
          ]}
        />
      </FilterBar>

      <CoursesTable
        items={tableRows}
        loading={loading}
        onDetail={openDetail}
        onApprove={(course) => runAction('approve', course, t('admin.courses.toast.approved'))}
        onPublish={(course) => runAction('publish', course, t('admin.courses.toast.published'))}
        onReject={setRejectTarget}
        onSuspend={setSuspendTarget}
        onDelete={setDeleteTarget}
      />

      <Modal
        isOpen={Boolean(rejectTarget)}
        title={t('admin.courses.detail.rejectTitle')}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={submitReject}>
          <p>{t('admin.courses.detail.rejectPrompt')} <strong>{rejectTarget?.titleAr}</strong></p>
          <Textarea
            label={t('admin.courses.detail.rejectReason')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <Button variant="danger">{t('admin.actions.confirmReject')}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(suspendTarget)}
        title={t('admin.courses.detail.suspendTitle')}
        message={t('admin.courses.detail.suspendMessage', { name: suspendTarget?.titleAr })}
        confirmLabel={t('admin.actions.confirmSuspend')}
        onConfirm={() => suspendTarget && runAction('suspend', suspendTarget, t('admin.courses.toast.suspended'))}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('admin.courses.detail.deleteTitle')}
        message={t('admin.courses.detail.deleteMessage', { name: deleteTarget?.titleAr })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
