import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, Radio, Video, Calendar, Clock } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
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
  SCHEDULED: 'مجدولة',
  LIVE: 'مباشر الآن',
  ENDED: 'منتهية',
  CANCELLED: 'ملغاة',
};

const statusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '—');

const toLocalInput = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const emptyForm = {
  titleAr: '',
  descriptionAr: '',
  startAt: '',
  durationMinutes: '60',
  meetingUrl: '',
  status: 'SCHEDULED',
};

const exportColumns = [
  { key: 'id', header: 'رقم الجلسة' },
  { key: 'title', header: 'العنوان' },
  { key: 'course', header: 'الكورس' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'startAt', header: 'موعد البدء' },
  { key: 'duration', header: 'المدة (دقيقة)' },
  { key: 'meetingUrl', header: 'رابط الاجتماع' },
  { key: 'status', header: 'الحالة' },
];

export default function AdminLiveSessionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.liveSessions());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.titleAr,
          i.descriptionAr,
          i.course?.titleAr,
          i.instructor?.fullName,
          i.instructor?.email,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    scheduled: items.filter((i) => i.status === 'SCHEDULED').length,
    live: items.filter((i) => i.status === 'LIVE').length,
    ended: items.filter((i) => i.status === 'ENDED').length,
    cancelled: items.filter((i) => i.status === 'CANCELLED').length,
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
    title: row.titleAr,
    course: row.course?.titleAr || '—',
    instructor: row.instructor?.fullName || '—',
    startAt: fmtDate(row.startAt),
    duration: `${row.durationMinutes} د`,
    meetingUrl: row.meetingUrl || '—',
    status: statusLabels[row.status] || row.status,
    _raw: row,
  })), [filteredItems]);

  const openDetail = (session: any) => {
    setSelected(session);
    setDetailOpen(true);
  };

  const openEdit = (session: any) => {
    setSelected(session);
    setForm({
      titleAr: session.titleAr,
      descriptionAr: session.descriptionAr || '',
      startAt: toLocalInput(session.startAt),
      durationMinutes: String(session.durationMinutes ?? 60),
      meetingUrl: session.meetingUrl || '',
      status: session.status,
    });
    setEditOpen(true);
  };

  const saveSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.updateLiveSession(selected.id, {
        titleAr: form.titleAr.trim(),
        descriptionAr: form.descriptionAr.trim() || null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        durationMinutes: Number(form.durationMinutes),
        meetingUrl: form.meetingUrl.trim() || null,
        status: form.status,
      });
      showToast('تم تحديث الجلسة.', 'success');
      setEditOpen(false);
      setSelected(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (session: any, status: string, message: string) => {
    await adminApi.updateLiveSession(session.id, { status });
    showToast(message, 'success');
    await load();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await adminApi.cancelLiveSession(cancelTarget.id);
    showToast('تم إلغاء الجلسة.', 'success');
    setCancelTarget(null);
    setDetailOpen(false);
    setSelected(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteLiveSession(deleteTarget.id);
    showToast('تم حذف الجلسة.', 'success');
    setDeleteTarget(null);
    await load();
  };

  const handleExport = () => {
    exportTableToExcel(
      'الجلسات-المباشرة',
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="الجلسات المباشرة" subtitle="إدارة ومراقبة جلسات البث المباشر على المنصة" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الجلسات" value={String(stats.total)} icon={Video} />
        <StatCard title="مجدولة" value={String(stats.scheduled)} icon={Calendar} />
        <StatCard title="مباشر الآن" value={String(stats.live)} icon={Radio} />
        <StatCard title="منتهية" value={String(stats.ended)} icon={Clock} />
        <StatCard title="ملغاة" value={String(stats.cancelled)} icon={Video} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات الجلسات" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان، الكورس، أو المحاضر..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'مجدولة', value: 'SCHEDULED' },
            { label: 'مباشر الآن', value: 'LIVE' },
            { label: 'منتهية', value: 'ENDED' },
            { label: 'ملغاة', value: 'CANCELLED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد جلسات"
          emptyDescription="ستظهر الجلسات المباشرة هنا عند جدولتها."
          columns={[
            { key: 'title', header: 'العنوان' },
            { key: 'course', header: 'الكورس' },
            { key: 'instructor', header: 'المحاضر' },
            { key: 'startAt', header: 'موعد البدء' },
            { key: 'duration', header: 'المدة' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const session = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(session)}>
                      التفاصيل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(session)}>
                      تعديل
                    </Button>
                    {session.meetingUrl ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(session.meetingUrl, '_blank', 'noopener,noreferrer')}
                      >
                        انضمام
                      </Button>
                    ) : null}
                    {session.status === 'SCHEDULED' ? (
                      <Button variant="secondary" size="sm" onClick={() => setStatus(session, 'LIVE', 'تم بدء الجلسة.')}>
                        بدء
                      </Button>
                    ) : null}
                    {session.status === 'LIVE' ? (
                      <Button variant="secondary" size="sm" onClick={() => setStatus(session, 'ENDED', 'تم إنهاء الجلسة.')}>
                        إنهاء
                      </Button>
                    ) : null}
                    {['SCHEDULED', 'LIVE'].includes(session.status) ? (
                      <Button variant="danger" size="sm" onClick={() => setCancelTarget(session)}>
                        إلغاء
                      </Button>
                    ) : null}
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(session)}>
                      حذف
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={detailOpen}
        title="تفاصيل الجلسة"
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {selected ? (
          <div className="stack-sm">
            <div className="detail-row"><span>رقم الجلسة</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>العنوان</span><strong>{selected.titleAr}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>المحاضر</span><strong>{selected.instructor?.fullName || '—'}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.instructor?.email || '—'}</strong></div>
            <div className="detail-row"><span>موعد البدء</span><strong>{fmtDate(selected.startAt)}</strong></div>
            <div className="detail-row"><span>المدة</span><strong>{selected.durationMinutes} دقيقة</strong></div>
            <div className="detail-row">
              <span>رابط الاجتماع</span>
              {selected.meetingUrl ? (
                <a href={selected.meetingUrl} target="_blank" rel="noopener noreferrer" dir="ltr">
                  {selected.meetingUrl}
                </a>
              ) : (
                <strong>—</strong>
              )}
            </div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            {selected.descriptionAr ? (
              <div className="detail-row"><span>الوصف</span><strong>{selected.descriptionAr}</strong></div>
            ) : null}
            <div className="chip-row">
              <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
                تعديل
              </Button>
              {selected.meetingUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => window.open(selected.meetingUrl, '_blank', 'noopener,noreferrer')}
                >
                  انضمام للجلسة
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={editOpen}
        title="تعديل الجلسة"
        onClose={() => { setEditOpen(false); setSelected(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveSession}>
          <Input
            label="عنوان الجلسة"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Input
            label="موعد البدء"
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
          />
          <Input
            label="المدة (دقيقة)"
            type="number"
            min="15"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
          <Input
            label="رابط الاجتماع"
            value={form.meetingUrl}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            placeholder="https://meet.example.com/..."
          />
          <Select
            label="الحالة"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'مجدولة', value: 'SCHEDULED' },
              { label: 'مباشر الآن', value: 'LIVE' },
              { label: 'منتهية', value: 'ENDED' },
              { label: 'ملغاة', value: 'CANCELLED' },
            ]}
          />
          <Textarea
            label="الوصف"
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
          />
          <Button loading={submitting}>حفظ التعديلات</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="إلغاء الجلسة"
        message={`هل أنت متأكد من إلغاء جلسة "${cancelTarget?.titleAr}"؟`}
        confirmLabel="تأكيد الإلغاء"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف الجلسة"
        message={`هل أنت متأكد من حذف جلسة "${deleteTarget?.titleAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
