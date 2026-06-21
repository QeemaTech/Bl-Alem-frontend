import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, GraduationCap, Plus, Users, Wallet } from 'lucide-react';
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

const approvalLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  SUSPENDED: 'موقوف',
};

const accountLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING: 'بانتظار التفعيل',
  SUSPENDED: 'موقوف',
  REJECTED: 'مرفوض',
};

const approvalVariant = (status: string) => {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  if (status === 'SUSPENDED') return 'suspended' as const;
  return 'default' as const;
};

const accountVariant = (status: string) => {
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

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  title: '',
  specialization: '',
  yearsOfExperience: '',
  bio: '',
  status: 'PENDING',
  approvalStatus: 'PENDING',
};

const exportColumns = [
  { key: 'id', header: 'رقم المحاضر' },
  { key: 'fullName', header: 'الاسم' },
  { key: 'email', header: 'البريد' },
  { key: 'phone', header: 'الهاتف' },
  { key: 'title', header: 'المسمى' },
  { key: 'specialization', header: 'التخصص' },
  { key: 'courses', header: 'الكورسات' },
  { key: 'students', header: 'الطلاب' },
  { key: 'earnings', header: 'الأرباح' },
  { key: 'approvalStatus', header: 'حالة الاعتماد' },
  { key: 'accountStatus', header: 'حالة الحساب' },
  { key: 'joinedAt', header: 'تاريخ الانضمام' },
];

export default function AdminInstructorsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.instructors());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (approvalFilter) {
      result = result.filter((i) => i.instructorProfile?.approvalStatus === approvalFilter);
    }
    if (accountFilter) result = result.filter((i) => i.status === accountFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.fullName,
          i.email,
          i.phone,
          i.instructorProfile?.title,
          i.instructorProfile?.specialization,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, approvalFilter, accountFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.instructorProfile?.approvalStatus === 'PENDING').length,
    approved: items.filter((i) => i.instructorProfile?.approvalStatus === 'APPROVED').length,
    rejected: items.filter((i) => i.instructorProfile?.approvalStatus === 'REJECTED').length,
    suspended: items.filter((i) => i.instructorProfile?.approvalStatus === 'SUSPENDED').length,
    courses: items.reduce((sum, i) => sum + Number(i._count?.courses || 0), 0),
    earnings: items.reduce((sum, i) => sum + Number(i.instructorProfile?.totalEarnings || 0), 0),
  }), [items]);

  const approvalChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = approvalLabels[i.instructorProfile?.approvalStatus] || '—';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '—',
    title: row.instructorProfile?.title || '—',
    specialization: row.instructorProfile?.specialization || '—',
    courses: String(row._count?.courses ?? 0),
    students: String(row.instructorProfile?.totalStudents ?? 0),
    earnings: fmtMoney(Number(row.instructorProfile?.totalEarnings || 0)),
    approvalStatus: approvalLabels[row.instructorProfile?.approvalStatus] || '—',
    accountStatus: accountLabels[row.status] || row.status,
    joinedAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (instructor: any) => {
    setEditing(instructor);
    setForm({
      fullName: instructor.fullName,
      email: instructor.email,
      phone: instructor.phone || '',
      password: '',
      title: instructor.instructorProfile?.title || '',
      specialization: instructor.instructorProfile?.specialization || '',
      yearsOfExperience: instructor.instructorProfile?.yearsOfExperience
        ? String(instructor.instructorProfile.yearsOfExperience)
        : '',
      bio: instructor.instructorProfile?.bio || '',
      status: instructor.status,
      approvalStatus: instructor.instructorProfile?.approvalStatus || 'PENDING',
    });
    setFormOpen(true);
  };

  const openDetail = async (instructor: any) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      setSelected(await adminApi.instructor(instructor.id));
    } finally {
      setDetailLoading(false);
    }
  };

  const saveInstructor = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        title: form.title.trim() || null,
        specialization: form.specialization.trim() || null,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
        bio: form.bio.trim() || null,
        status: form.status,
        approvalStatus: form.approvalStatus,
      };
      if (editing) {
        if (form.password.trim()) payload.password = form.password;
        await adminApi.updateInstructor(editing.id, payload);
        showToast('تم تحديث المحاضر.', 'success');
      } else {
        payload.password = form.password.trim() || 'Password123!';
        await adminApi.createInstructor(payload);
        showToast('تم إنشاء المحاضر.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ بيانات المحاضر.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (instructor: any) => {
    await adminApi.approveInstructor(instructor.id);
    showToast('تم اعتماد المحاضر.', 'success');
    await load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await adminApi.rejectInstructor(rejectTarget.id, rejectReason);
    showToast('تم رفض المحاضر.', 'success');
    setRejectTarget(null);
    setRejectReason('');
    setDetailOpen(false);
    await load();
  };

  const handleSuspend = async (instructor: any) => {
    await adminApi.suspendInstructor(instructor.id);
    showToast('تم إيقاف المحاضر.', 'success');
    await load();
  };

  const handleActivate = async (instructor: any) => {
    await adminApi.activateInstructor(instructor.id);
    showToast('تم تفعيل المحاضر.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteInstructor(deleteTarget.id);
      showToast('تم حذف المحاضر.', 'success');
      setDeleteTarget(null);
      setDetailOpen(false);
      await load();
    } catch {
      showToast('لا يمكن حذف محاضر لديه دورات.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('المحاضرون', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المحاضرون" subtitle="إدارة حسابات المحاضرين واعتماد طلباتهم" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة محاضر
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي المحاضرين" value={String(stats.total)} icon={GraduationCap} />
        <StatCard title="قيد المراجعة" value={String(stats.pending)} icon={Users} />
        <StatCard title="معتمدون" value={String(stats.approved)} icon={GraduationCap} />
        <StatCard title="مرفوضون / موقوفون" value={String(stats.rejected + stats.suspended)} icon={Users} />
        <StatCard title="إجمالي الكورسات" value={String(stats.courses)} icon={BookOpen} />
        <StatCard title="إجمالي الأرباح" value={fmtMoney(stats.earnings)} icon={Wallet} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات الاعتماد" type="pie" data={approvalChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالاسم، البريد، التخصص..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setApprovalFilter(''); setAccountFilter(''); }}
      >
        <Select
          label="حالة الاعتماد"
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'قيد المراجعة', value: 'PENDING' },
            { label: 'معتمد', value: 'APPROVED' },
            { label: 'مرفوض', value: 'REJECTED' },
            { label: 'موقوف', value: 'SUSPENDED' },
          ]}
        />
        <Select
          label="حالة الحساب"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          options={[
            { label: 'كل الحسابات', value: '' },
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
          emptyTitle="لا يوجد محاضرون"
          emptyDescription="أضف محاضراً جديداً أو انتظر طلبات التسجيل."
          columns={[
            { key: 'fullName', header: 'الاسم' },
            { key: 'email', header: 'البريد' },
            { key: 'phone', header: 'الهاتف' },
            { key: 'specialization', header: 'التخصص' },
            { key: 'courses', header: 'الكورسات' },
            { key: 'students', header: 'الطلاب' },
            { key: 'earnings', header: 'الأرباح' },
            {
              key: 'approvalStatus',
              header: 'الاعتماد',
              render: (row) => (
                <Badge variant={approvalVariant(String(row._raw?.instructorProfile?.approvalStatus))}>
                  {approvalLabels[String(row._raw?.instructorProfile?.approvalStatus)] || row.approvalStatus}
                </Badge>
              ),
            },
            {
              key: 'accountStatus',
              header: 'الحساب',
              render: (row) => (
                <Badge variant={accountVariant(String(row._raw?.status))}>
                  {accountLabels[String(row._raw?.status)] || row.accountStatus}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const instructor = row._raw;
                const approval = instructor.instructorProfile?.approvalStatus;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(instructor)}>
                      التفاصيل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(instructor)}>
                      تعديل
                    </Button>
                    {approval === 'PENDING' ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleApprove(instructor)}>
                          اعتماد
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setRejectTarget(instructor)}>
                          رفض
                        </Button>
                      </>
                    ) : null}
                    {['APPROVED', 'ACTIVE'].includes(approval) && instructor.status === 'ACTIVE' ? (
                      <Button variant="secondary" size="sm" onClick={() => handleSuspend(instructor)}>
                        إيقاف
                      </Button>
                    ) : null}
                    {['SUSPENDED', 'REJECTED'].includes(approval) || instructor.status === 'SUSPENDED' ? (
                      <Button variant="secondary" size="sm" onClick={() => handleActivate(instructor)}>
                        تفعيل
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(instructor)}
                      disabled={Number(instructor._count?.courses || 0) > 0}
                    >
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
        title="تفاصيل المحاضر"
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {detailLoading ? <p>جاري التحميل...</p> : null}
        {selected && !detailLoading ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الاسم</span><strong>{selected.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.email}</strong></div>
            <div className="detail-row"><span>الهاتف</span><strong dir="ltr">{selected.phone || '—'}</strong></div>
            <div className="detail-row"><span>المسمى</span><strong>{selected.instructorProfile?.title || '—'}</strong></div>
            <div className="detail-row"><span>التخصص</span><strong>{selected.instructorProfile?.specialization || '—'}</strong></div>
            <div className="detail-row"><span>سنوات الخبرة</span><strong>{selected.instructorProfile?.yearsOfExperience ?? '—'}</strong></div>
            <div className="detail-row"><span>الطلاب</span><strong>{selected.instructorProfile?.totalStudents ?? 0}</strong></div>
            <div className="detail-row"><span>الأرباح</span><strong>{fmtMoney(Number(selected.instructorProfile?.totalEarnings || 0))}</strong></div>
            <div className="detail-row"><span>رصيد المحفظة</span><strong>{fmtMoney(Number(selected.wallet?.balance || 0))}</strong></div>
            <div className="detail-row">
              <span>حالة الاعتماد</span>
              <Badge variant={approvalVariant(selected.instructorProfile?.approvalStatus)}>
                {approvalLabels[selected.instructorProfile?.approvalStatus] || '—'}
              </Badge>
            </div>
            <div className="detail-row">
              <span>حالة الحساب</span>
              <Badge variant={accountVariant(selected.status)}>
                {accountLabels[selected.status] || selected.status}
              </Badge>
            </div>
            {selected.instructorProfile?.rejectionReason ? (
              <div className="detail-row"><span>سبب الرفض</span><strong>{selected.instructorProfile.rejectionReason}</strong></div>
            ) : null}
            {selected.instructorProfile?.bio ? (
              <div className="detail-row"><span>نبذة</span><strong>{selected.instructorProfile.bio}</strong></div>
            ) : null}
            <div className="detail-row"><span>تاريخ الانضمام</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            {selected.courses?.length ? (
              <div className="stack-sm">
                <h4>الكورسات ({selected.courses.length})</h4>
                {selected.courses.map((course: any) => (
                  <div key={course.id} className="notification-card">
                    <span>{course.titleAr}</span>
                    <span>{course.totalStudents ?? 0} طالب</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="chip-row">
              <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
                تعديل
              </Button>
              {selected.instructorProfile?.approvalStatus === 'PENDING' ? (
                <Button onClick={() => handleApprove(selected)}>اعتماد</Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل المحاضر' : 'إضافة محاضر'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveInstructor}>
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
          <Input label="المسمى الوظيفي" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="خبير JavaScript" />
          <Input label="التخصص" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <Input label="سنوات الخبرة" type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
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
          <Select
            label="حالة الاعتماد"
            value={form.approvalStatus}
            onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
            options={[
              { label: 'قيد المراجعة', value: 'PENDING' },
              { label: 'معتمد', value: 'APPROVED' },
              { label: 'مرفوض', value: 'REJECTED' },
              { label: 'موقوف', value: 'SUSPENDED' },
            ]}
          />
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء المحاضر'}</Button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(rejectTarget)}
        title="رفض المحاضر"
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
      >
        <form className="stack-sm" onSubmit={handleReject}>
          <p>رفض طلب: <strong>{rejectTarget?.fullName}</strong></p>
          <Textarea label="سبب الرفض" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف المحاضر"
        message={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
