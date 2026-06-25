import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, GraduationCap, Layers, Users } from '@/icons';
import { adminApi } from '../../api/admin';
import { buildCourseTableRows, CoursesTable } from '../../components/admin/courses/CoursesTable';
import { statusLabels } from '../../components/admin/courses/courseShared';
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
import { exportTableToExcel } from '../../utils/exportExcel';

const exportColumns = [
  { key: 'id', header: 'رقم الكورس' },
  { key: 'title', header: 'العنوان' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'category', header: 'التصنيف' },
  { key: 'level', header: 'المستوى' },
  { key: 'price', header: 'السعر' },
  { key: 'students', header: 'الطلاب' },
  { key: 'lessons', header: 'الدروس' },
  { key: 'status', header: 'الحالة' },
  { key: 'updatedAt', header: 'آخر تحديث' },
];

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const tableRows = useMemo(() => buildCourseTableRows(filteredItems), [filteredItems]);

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
    showToast('تم رفض الكورس.', 'success');
    setRejectTarget(null);
    setRejectReason('');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteCourse(deleteTarget.id);
    showToast('تم حذف الكورس.', 'success');
    setDeleteTarget(null);
    await load();
  };

  const handleExport = () => {
    exportTableToExcel('الكورسات', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid admin-courses-page">
      <div className="reports-header">
        <PageHeader title="الكورسات" subtitle="مراجعة وإدارة دورات المنصة التعليمية" />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الكورسات" value={String(stats.total)} icon={BookOpen} />
        <StatCard title="منشورة" value={String(stats.published)} icon={GraduationCap} />
        <StatCard title="قيد المراجعة" value={String(stats.pending)} icon={Layers} />
        <StatCard title="مسودات" value={String(stats.draft)} icon={BookOpen} />
        <StatCard title="مرفوضة / موقوفة" value={String(stats.rejected + stats.suspended)} icon={Layers} />
        <StatCard title="إجمالي الطلاب" value={String(stats.students)} icon={Users} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات الكورسات" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان، المحاضر، أو التصنيف..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'مسودة', value: 'DRAFT' },
            { label: 'قيد المراجعة', value: 'PENDING_REVIEW' },
            { label: 'معتمد', value: 'APPROVED' },
            { label: 'منشور', value: 'PUBLISHED' },
            { label: 'مرفوض', value: 'REJECTED' },
            { label: 'موقوف', value: 'SUSPENDED' },
          ]}
        />
        <Select
          label="التصنيف"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: 'كل التصنيفات', value: '' },
            ...categories.map((c) => ({ label: c.nameAr, value: String(c.id) })),
          ]}
        />
      </FilterBar>

      <CoursesTable
        items={tableRows}
        loading={loading}
        onDetail={openDetail}
        onApprove={(course) => runAction('approve', course, 'تم اعتماد الكورس.')}
        onPublish={(course) => runAction('publish', course, 'تم نشر الكورس.')}
        onReject={setRejectTarget}
        onSuspend={setSuspendTarget}
        onDelete={setDeleteTarget}
      />

      <Modal
        isOpen={Boolean(rejectTarget)}
        title="رفض الكورس"
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={submitReject}>
          <p>رفض كورس: <strong>{rejectTarget?.titleAr}</strong></p>
          <Textarea
            label="سبب الرفض"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(suspendTarget)}
        title="إيقاف الكورس"
        message={`هل أنت متأكد من إيقاف كورس "${suspendTarget?.titleAr}" مؤقتاً؟`}
        confirmLabel="تأكيد الإيقاف"
        onConfirm={() => suspendTarget && runAction('suspend', suspendTarget, 'تم إيقاف الكورس.')}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف الكورس"
        message={`هل أنت متأكد من حذف كورس "${deleteTarget?.titleAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
