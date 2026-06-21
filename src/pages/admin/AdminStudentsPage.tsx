import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, Download, Plus, Users, Wallet } from 'lucide-react';
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
  ACTIVE: 'نشط',
  PENDING: 'بانتظار التفعيل',
  SUSPENDED: 'موقوف',
  REJECTED: 'مرفوض',
};

const enrollmentLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const fmtMoney = (value: number) => `${Number(value || 0).toLocaleString('ar-SA')} ر.س`;

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const formatInterests = (interests: unknown) => {
  if (!interests) return '—';
  if (Array.isArray(interests)) return interests.join('، ');
  return String(interests);
};

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  bio: '',
  educationLevel: '',
  interests: '',
  status: 'ACTIVE',
};

const exportColumns = [
  { key: 'id', header: 'رقم الطالب' },
  { key: 'fullName', header: 'الاسم' },
  { key: 'email', header: 'البريد' },
  { key: 'phone', header: 'الهاتف' },
  { key: 'educationLevel', header: 'المستوى التعليمي' },
  { key: 'enrollments', header: 'الاشتراكات' },
  { key: 'payments', header: 'المدفوعات' },
  { key: 'certificates', header: 'الشهادات' },
  { key: 'wallet', header: 'رصيد المحفظة' },
  { key: 'status', header: 'الحالة' },
  { key: 'joinedAt', header: 'تاريخ الانضمام' },
];

export default function AdminStudentsPage() {
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
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.students());
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
          i.fullName,
          i.email,
          i.phone,
          i.studentProfile?.educationLevel,
          i.studentProfile?.bio,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    suspended: items.filter((i) => i.status === 'SUSPENDED').length,
    pending: items.filter((i) => i.status === 'PENDING').length,
    enrollments: items.reduce((sum, i) => sum + Number(i._count?.enrollments || 0), 0),
    certificates: items.reduce((sum, i) => sum + Number(i._count?.certificates || 0), 0),
    walletTotal: items.reduce((sum, i) => sum + Number(i.wallet?.balance || 0), 0),
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
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '—',
    educationLevel: row.studentProfile?.educationLevel || '—',
    enrollments: String(row._count?.enrollments ?? 0),
    payments: String(row._count?.payments ?? 0),
    certificates: String(row._count?.certificates ?? 0),
    wallet: fmtMoney(Number(row.wallet?.balance || 0)),
    status: statusLabels[row.status] || row.status,
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (student: any) => {
    setEditing(student);
    setForm({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || '',
      password: '',
      bio: student.studentProfile?.bio || '',
      educationLevel: student.studentProfile?.educationLevel || '',
      interests: formatInterests(student.studentProfile?.interests) === '—'
        ? ''
        : formatInterests(student.studentProfile?.interests),
      status: student.status,
    });
    setFormOpen(true);
  };

  const openDetail = async (student: any) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      setSelected(await adminApi.student(student.id));
    } finally {
      setDetailLoading(false);
    }
  };

  const saveStudent = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        educationLevel: form.educationLevel.trim() || null,
        interests: form.interests.trim() || null,
        status: form.status,
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateStudent(editing.id, payload);
        showToast('تم تحديث الطالب.', 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createStudent(payload);
        showToast('تم إنشاء الطالب.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ بيانات الطالب.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (student: any) => {
    const next = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await adminApi.userStatus(student.id, next);
    showToast(next === 'ACTIVE' ? 'تم تفعيل الحساب.' : 'تم إيقاف الحساب.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteStudent(deleteTarget.id);
      showToast('تم حذف الطالب.', 'success');
      setDeleteTarget(null);
      setDetailOpen(false);
      await load();
    } catch {
      showToast('تعذّر حذف الطالب.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('الطلاب', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="الطلاب" subtitle="إدارة حسابات الطلاب ومتابعة نشاطهم التعليمي" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة طالب
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الطلاب" value={String(stats.total)} icon={Users} />
        <StatCard title="نشطون" value={String(stats.active)} icon={Users} />
        <StatCard title="موقوفون" value={String(stats.suspended)} icon={Users} />
        <StatCard title="إجمالي الاشتراكات" value={String(stats.enrollments)} icon={BookOpen} />
        <StatCard title="الشهادات" value={String(stats.certificates)} icon={Award} />
        <StatCard title="إجمالي أرصدة المحافظ" value={fmtMoney(stats.walletTotal)} icon={Wallet} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات الحسابات" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالاسم، البريد، أو المستوى التعليمي..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="حالة الحساب"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'نشط', value: 'ACTIVE' },
            { label: 'بانتظار التفعيل', value: 'PENDING' },
            { label: 'موقوف', value: 'SUSPENDED' },
            { label: 'مرفوض', value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا يوجد طلاب"
          emptyDescription="أضف طالباً جديداً أو انتظر التسجيلات."
          columns={[
            { key: 'fullName', header: 'الاسم' },
            { key: 'email', header: 'البريد' },
            { key: 'phone', header: 'الهاتف' },
            { key: 'educationLevel', header: 'المستوى التعليمي' },
            { key: 'enrollments', header: 'الاشتراكات' },
            { key: 'payments', header: 'المدفوعات' },
            { key: 'certificates', header: 'الشهادات' },
            { key: 'wallet', header: 'المحفظة' },
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
                const student = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(student)}>
                      التفاصيل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(student)}>
                      تعديل
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(student)}>
                      {student.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(student)}>
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
        title="تفاصيل الطالب"
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {detailLoading ? <p>جاري التحميل...</p> : null}
        {selected && !detailLoading ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الاسم</span><strong>{selected.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.email}</strong></div>
            <div className="detail-row"><span>الهاتف</span><strong dir="ltr">{selected.phone || '—'}</strong></div>
            <div className="detail-row"><span>المستوى التعليمي</span><strong>{selected.studentProfile?.educationLevel || '—'}</strong></div>
            <div className="detail-row"><span>الاهتمامات</span><strong>{formatInterests(selected.studentProfile?.interests)}</strong></div>
            <div className="detail-row"><span>رصيد المحفظة</span><strong>{fmtMoney(Number(selected.wallet?.balance || 0))}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            {selected.studentProfile?.bio ? (
              <div className="detail-row"><span>نبذة</span><strong>{selected.studentProfile.bio}</strong></div>
            ) : null}
            <div className="detail-row"><span>تاريخ الانضمام</span><strong>{fmtDate(selected.createdAt)}</strong></div>

            {selected.enrollments?.length ? (
              <div className="stack-sm">
                <h4>الاشتراكات ({selected.enrollments.length})</h4>
                {selected.enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="notification-card">
                    <span>{enrollment.course?.titleAr}</span>
                    <span>{enrollmentLabels[enrollment.status] || enrollment.status}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {selected.payments?.length ? (
              <div className="stack-sm">
                <h4>آخر المدفوعات</h4>
                {selected.payments.map((payment: any) => (
                  <div key={payment.id} className="notification-card">
                    <span>{payment.course?.titleAr || '—'}</span>
                    <span>{fmtMoney(Number(payment.finalAmount))}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {selected.certificates?.length ? (
              <div className="stack-sm">
                <h4>الشهادات ({selected.certificates.length})</h4>
                {selected.certificates.map((cert: any) => (
                  <div key={cert.id} className="notification-card">
                    <span>{cert.course?.titleAr}</span>
                    <span>{cert.certificateNumber}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="chip-row">
              <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
                تعديل
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل الطالب' : 'إضافة طالب'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveStudent}>
          <Input label="الاسم الكامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
          <Input
            label={editing ? 'كلمة المرور (اتركها فارغة بدون تغيير)' : 'كلمة المرور'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <Input label="المستوى التعليمي" value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })} placeholder="ثانوي، جامعي..." />
          <Input label="الاهتمامات (مفصولة بفاصلة)" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="البرمجة، التصميم" />
          <Textarea label="نبذة" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Select
            label="حالة الحساب"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'نشط', value: 'ACTIVE' },
              { label: 'بانتظار التفعيل', value: 'PENDING' },
              { label: 'موقوف', value: 'SUSPENDED' },
              { label: 'مرفوض', value: 'REJECTED' },
            ]}
          />
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء الطالب'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف الطالب"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ سيتم حذف جميع بياناته.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
