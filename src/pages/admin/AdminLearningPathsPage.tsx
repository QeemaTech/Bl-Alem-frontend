import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FolderTree, Layers, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  ACTIVE: 'فعّال',
  INACTIVE: 'غير فعّال',
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const emptyForm = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  coverImage: '',
  status: 'ACTIVE',
};

const exportColumns = [
  { key: 'id', header: 'رقم المسار' },
  { key: 'titleAr', header: 'عنوان المسار' },
  { key: 'courses', header: 'عدد الدورات' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
];

export default function AdminLearningPathsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPath, setDetailPath] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [detailBusy, setDetailBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminApi.learningPaths());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.titleEn, i.descriptionAr, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    inactive: items.filter((i) => i.status === 'INACTIVE').length,
    courses: items.reduce((sum, i) => sum + Number(i._count?.courses || 0), 0),
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    titleAr: row.titleAr,
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (path: any) => {
    setEditing(path);
    setForm({
      titleAr: path.titleAr || '',
      titleEn: path.titleEn || '',
      descriptionAr: path.descriptionAr || '',
      coverImage: path.coverImage || '',
      status: path.status || 'ACTIVE',
    });
    setFormOpen(true);
  };

  const openDetail = async (path: any) => {
    setDetailOpen(true);
    setDetailBusy(true);
    try {
      const [detail, publishedCourses] = await Promise.all([
        adminApi.learningPath(path.id),
        courses.length ? Promise.resolve(courses) : adminApi.courses({ status: 'PUBLISHED' }),
      ]);
      setCourses(publishedCourses);
      setDetailPath(detail);
    } finally {
      setDetailBusy(false);
    }
  };

  const savePath = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titleAr.trim()) {
      showToast('عنوان المسار مطلوب.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim() || null,
        descriptionAr: form.descriptionAr.trim() || null,
        coverImage: form.coverImage.trim() || null,
        status: form.status,
      };
      if (editing) {
        await adminApi.updateLearningPath(editing.id, payload);
        showToast('تم تحديث المسار.', 'success');
      } else {
        await adminApi.createLearningPath(payload);
        showToast('تم إنشاء المسار.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ المسار.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteLearningPath(deleteTarget.id);
      showToast('تم حذف المسار.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('تعذّر حذف المسار.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('المسارات التعليمية', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  const sortedCourses = useMemo(() => {
    if (!detailPath?.courses) return [];
    return [...detailPath.courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [detailPath]);

  const refreshDetail = async () => {
    if (!detailPath) return;
    setDetailBusy(true);
    try {
      setDetailPath(await adminApi.learningPath(detailPath.id));
    } finally {
      setDetailBusy(false);
    }
  };

  const addCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (!detailPath || !selectedCourseId) return;
    try {
      await adminApi.addLearningPathCourse(detailPath.id, { courseId: Number(selectedCourseId) });
      showToast('تم إضافة الكورس للمسار.', 'success');
      setSelectedCourseId('');
      await refreshDetail();
    } catch {
      showToast('تعذّر إضافة الكورس للمسار.', 'error');
    }
  };

  const removeCourse = async (courseId: number) => {
    if (!detailPath) return;
    try {
      await adminApi.removeLearningPathCourse(detailPath.id, courseId);
      showToast('تم إزالة الكورس من المسار.', 'success');
      await refreshDetail();
    } catch {
      showToast('تعذّر إزالة الكورس.', 'error');
    }
  };

  const reorderCourses = async (nextCourses: any[]) => {
    if (!detailPath) return;
    const payload = nextCourses.map((item, index) => ({ id: item.id, order: index + 1 }));
    await adminApi.reorderLearningPathCourses(detailPath.id, payload);
    setDetailPath({ ...detailPath, courses: payload.map((item, index) => ({ ...nextCourses[index], order: item.order })) });
  };

  const moveCourse = async (index: number, direction: 'up' | 'down') => {
    if (!detailPath) return;
    const next = [...sortedCourses];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    try {
      await reorderCourses(next);
    } catch {
      showToast('تعذّر تحديث الترتيب.', 'error');
    }
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المسارات التعليمية" subtitle="إدارة المسارات التعليمية وربط الدورات بها" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            مسار جديد
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي المسارات" value={String(stats.total)} icon={FolderTree} />
        <StatCard title="فعّالة" value={String(stats.active)} icon={Layers} />
        <StatCard title="غير فعّالة" value={String(stats.inactive)} icon={Layers} />
        <StatCard title="إجمالي الدورات" value={String(stats.courses)} icon={Layers} />
      </div>

      {statusChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع حالات المسارات" type="pie" data={statusChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث باسم المسار أو الوصف..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'فعّال', value: 'ACTIVE' },
            { label: 'غير فعّال', value: 'INACTIVE' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد مسارات"
          emptyDescription="ابدأ بإنشاء مسار تعليمي جديد."
          columns={[
            { key: 'id', header: 'الرقم' },
            { key: 'titleAr', header: 'المسار' },
            { key: 'courses', header: 'الدورات' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => <Badge variant={statusVariant(String(row._raw?.status))}>{row.status}</Badge>,
            },
            { key: 'createdAt', header: 'التاريخ' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => (
                <div className="table-actions">
                  <Button size="sm" variant="secondary" onClick={() => openDetail(row._raw)}>إدارة الدورات</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(row._raw)}>تعديل</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row._raw)}>حذف</Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={formOpen} title={editing ? 'تعديل المسار' : 'مسار جديد'} onClose={() => !submitting && setFormOpen(false)}>
        <form className="stack-sm" onSubmit={savePath}>
          <Input label="العنوان العربي" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} required />
          <Input label="العنوان الإنجليزي" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
          <Textarea label="وصف المسار" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
          <Input label="رابط الغلاف" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
          <Select
            label="الحالة"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'فعّال', value: 'ACTIVE' },
              { label: 'غير فعّال', value: 'INACTIVE' },
            ]}
          />
          <div className="card-actions">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting}>حفظ</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailOpen} title="إدارة كورسات المسار" onClose={() => setDetailOpen(false)}>
        {detailBusy ? (
          <EmptyState title="جاري التحميل..." description="يتم جلب تفاصيل المسار." />
        ) : detailPath ? (
          <div className="stack-sm">
            <div>
              <strong>{detailPath.titleAr}</strong>
              <p>{detailPath.descriptionAr || '—'}</p>
            </div>
            <form className="stack-sm" onSubmit={addCourse}>
              <Select
                label="إضافة كورس"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={[
                  { label: 'اختر كورساً', value: '' },
                  ...courses
                    .filter((course) => !sortedCourses.some((item) => item.courseId === course.id))
                    .map((course) => ({ label: course.titleAr, value: String(course.id) })),
                ]}
              />
              <Button type="submit" icon={<Plus size={16} />}>إضافة للكورس</Button>
            </form>
            {sortedCourses.length ? (
              <div className="stack-sm">
                {sortedCourses.map((item, index) => (
                  <Card key={item.id} className="detail-row">
                    <div>
                      <strong>{item.course?.titleAr || '—'}</strong>
                      <p className="muted-count">{item.course?.instructor?.fullName || '—'}</p>
                    </div>
                    <div className="card-actions">
                      <Button size="sm" variant="ghost" onClick={() => moveCourse(index, 'up')} disabled={index === 0}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveCourse(index, 'down')} disabled={index === sortedCourses.length - 1}>
                        <ArrowDown size={14} />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeCourse(item.courseId)} icon={<Trash2 size={14} />}>
                        إزالة
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد دورات" description="أضف دورات إلى هذا المسار لتظهر للطلاب." />
            )}
          </div>
        ) : (
          <EmptyState title="لا يوجد مسار" description="اختر مساراً لعرض التفاصيل." />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف المسار"
        message="هل أنت متأكد من حذف هذا المسار؟ سيتم إزالة الربط مع الدورات."
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
